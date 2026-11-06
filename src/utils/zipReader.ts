export interface ZipFileInfo {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
}

/**
 * Fast, memory-safe reader for ZIP and ZIP64 archives using Blob.slice().
 * Only reads the Central Directory (a few KBs at the end of the archive)
 * without loading the gigabyte payload into memory.
 * Works seamlessly on multi-gigabyte ZIP files (e.g. 3GB+ FASTQ archives) in milliseconds.
 */
export async function extractZipEntryList(file: File | Blob): Promise<ZipFileInfo[]> {
  try {
    const fileSize = file.size;
    if (fileSize < 22) return [];

    // Read the last 128KB (or entire file if smaller) to locate the End of Central Directory (EOCD)
    const tailSize = Math.min(fileSize, 128 * 1024);
    const tailBlob = file.slice(fileSize - tailSize, fileSize);
    const tailBuffer = await tailBlob.arrayBuffer();
    const tailView = new DataView(tailBuffer);

    let eocdRelOffset = -1;
    // Scan backwards for EOCD signature 0x06054b50 (PK\x05\x06)
    for (let i = tailBuffer.byteLength - 22; i >= 0; i--) {
      if (tailView.getUint32(i, true) === 0x06054b50) {
        eocdRelOffset = i;
        break;
      }
    }

    if (eocdRelOffset === -1) {
      return [];
    }

    let totalEntries = tailView.getUint16(eocdRelOffset + 10, true);
    let cdSize = tailView.getUint32(eocdRelOffset + 12, true);
    let cdOffset = tailView.getUint32(eocdRelOffset + 16, true);

    // Check for ZIP64 end of central directory locator: signature 0x07064b50 (PK\x06\x07)
    let zip64LocRelOffset = -1;
    for (let k = eocdRelOffset - 20; k >= Math.max(0, eocdRelOffset - 64); k--) {
      if (tailView.getUint32(k, true) === 0x07064b50) {
        zip64LocRelOffset = k;
        break;
      }
    }

    if (zip64LocRelOffset >= 0) {
      const zip64EocdOffset = Number(tailView.getBigUint64(zip64LocRelOffset + 8, true));
      if (zip64EocdOffset < fileSize) {
        // Read ZIP64 EOCD Record (56 bytes minimum): signature 0x06064b50
        const zip64Blob = file.slice(zip64EocdOffset, Math.min(fileSize, zip64EocdOffset + 128));
        const zip64Buf = await zip64Blob.arrayBuffer();
        const zip64View = new DataView(zip64Buf);
        if (zip64View.byteLength >= 56 && zip64View.getUint32(0, true) === 0x06064b50) {
          totalEntries = Number(zip64View.getBigUint64(32, true));
          cdSize = Number(zip64View.getBigUint64(40, true));
          cdOffset = Number(zip64View.getBigUint64(48, true));
        }
      }
    }

    // Safety checks
    if (cdOffset >= fileSize || cdSize <= 0 || cdSize > 50 * 1024 * 1024) {
      return [];
    }

    // Slice exclusively the Central Directory
    const cdBlob = file.slice(cdOffset, cdOffset + cdSize);
    const cdBuffer = await cdBlob.arrayBuffer();
    const cdView = new DataView(cdBuffer);
    const textDecoder = new TextDecoder('utf-8');

    const results: ZipFileInfo[] = [];
    const seenNames = new Set<string>();
    let ptr = 0;

    while (ptr + 46 <= cdBuffer.byteLength) {
      // Central directory header signature: 0x02014b50 (PK\x01\x02)
      if (cdView.getUint32(ptr, true) !== 0x02014b50) {
        break;
      }

      const compressedSize = cdView.getUint32(ptr + 20, true);
      const uncompressedSize = cdView.getUint32(ptr + 24, true);
      const nameLen = cdView.getUint16(ptr + 28, true);
      const extraLen = cdView.getUint16(ptr + 30, true);
      const commentLen = cdView.getUint16(ptr + 32, true);

      if (ptr + 46 + nameLen > cdBuffer.byteLength) break;

      const nameBytes = new Uint8Array(cdBuffer, ptr + 46, nameLen);
      const rawName = textDecoder.decode(nameBytes);

      // Normalize Windows backslashes and skip directories / Mac metadata
      const normalizedName = rawName.replace(/\\/g, '/');
      if (!normalizedName.endsWith('/')) {
        const cleanName = normalizedName.split('/').pop() || normalizedName;
        if (
          cleanName && 
          !cleanName.startsWith('__MACOSX') && 
          !cleanName.startsWith('.') && 
          !normalizedName.includes('/.') &&
          !seenNames.has(cleanName)
        ) {
          seenNames.add(cleanName);
          results.push({
            name: cleanName,
            compressedSize,
            uncompressedSize,
          });
        }
      }

      ptr += 46 + nameLen + extraLen + commentLen;
    }

    return results;
  } catch (err) {
    console.warn('Fast central directory zip parse failed, will fallback:', err);
    return [];
  }
}

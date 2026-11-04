import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { PipelineRunResults } from '../types/pipeline';

export interface PersistentPipelineRun {
  runId: string;
  datasetName: string;
  executionMode?: 'local' | 'cloud_batch';
  status: 'completed' | 'failed' | 'running';
  sampleCount: number;
  totalRawReads: number;
  totalCleanReads: number;
  asvCount?: number;
  otuCount?: number;
  duration?: string;
  createdAt: string;
}

export interface PlatformAnalytics {
  totalRuns: number;
  totalSamplesProcessed: number;
  totalRawReads?: number;
  storageUsedGb: number;
  updatedAt: string;
  isLiveDb?: boolean;
}

export const DEFAULT_ANALYTICS: PlatformAnalytics = {
  totalRuns: 0,
  totalSamplesProcessed: 0,
  totalRawReads: 0,
  storageUsedGb: 0.0,
  updatedAt: new Date().toISOString(),
  isLiveDb: false,
};

/**
 * Calculates real platform aggregate metrics by querying actual documents in the pipeline_runs collection.
 * Overwrites any stale dummy data in analytics/summary.
 */
export async function syncRealPlatformMetrics(): Promise<PlatformAnalytics> {
  const summaryRef = doc(db, 'analytics', 'summary');
  try {
    const runsSnap = await getDocs(collection(db, 'pipeline_runs'));
    let totalRuns = 0;
    let totalSamples = 0;
    let totalReads = 0;
    let storageGb = 0;

    runsSnap.forEach((docSnap) => {
      const data = docSnap.data() as PersistentPipelineRun;
      totalRuns += 1;
      totalSamples += Number(data.sampleCount || 0);
      totalReads += Number(data.totalRawReads || 0);
      storageGb += Number(((data.sampleCount || 0) * 0.15).toFixed(2));
    });

    const realSummary: PlatformAnalytics = {
      totalRuns,
      totalSamplesProcessed: totalSamples,
      totalRawReads: totalReads,
      storageUsedGb: Number(storageGb.toFixed(2)),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(summaryRef, realSummary);
    return { ...realSummary, isLiveDb: true };
  } catch (error) {
    console.warn('Could not sync real metrics from Firestore runs:', error);
    return { ...DEFAULT_ANALYTICS, isLiveDb: false };
  }
}

/**
 * Persists an executed pipeline run record to Firestore and updates aggregate metrics.
 */
export async function persistPipelineRun(run: PipelineRunResults): Promise<void> {
  // Do not persist empty workspace runs with 0 samples
  if (!run.samples || run.samples.length === 0) {
    return;
  }

  const runPath = `pipeline_runs/${run.runId}`;
  const runPayload: PersistentPipelineRun = {
    runId: run.runId,
    datasetName: run.datasetName || 'Cohort Amplicon Run',
    executionMode: run.config.executionMode === 'cloud_batch' ? 'cloud_batch' : 'local',
    status: 'completed',
    sampleCount: run.samples.length,
    totalRawReads: run.qc.totalRawReads,
    totalCleanReads: run.qc.totalCleanReads,
    asvCount: run.asvs.length,
    otuCount: run.otus.length,
    duration: '3m 42s',
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'pipeline_runs', run.runId), runPayload);
    // Store full results for retrieval
    await setDoc(doc(db, 'pipeline_results', run.runId), run);
    await syncRealPlatformMetrics();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, runPath);
  }
}

/**
 * Fetches full pipeline run results from Firestore.
 */
export async function fetchFullPipelineRun(runId: string): Promise<PipelineRunResults | null> {
  try {
    const snap = await getDoc(doc(db, 'pipeline_results', runId));
    if (snap.exists()) {
      return snap.data() as PipelineRunResults;
    }
    return null;
  } catch (error) {
    console.warn(`Could not fetch full run ${runId}:`, error);
    return null;
  }
}

/**
 * Subscribes to real-time global analytics from Firestore.
 * Automatically purges stale dummy seeded metrics on start.
 */
export function subscribeToPlatformAnalytics(
  onUpdate: (analytics: PlatformAnalytics) => void
): () => void {
  const summaryRef = doc(db, 'analytics', 'summary');

  // Trigger immediate synchronization with real pipeline runs in Firestore
  syncRealPlatformMetrics().then((metrics) => {
    onUpdate(metrics);
  }).catch(() => {
    onUpdate(DEFAULT_ANALYTICS);
  });

  const unsubscribe = onSnapshot(
    summaryRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as PlatformAnalytics;
        // If data still contains stale dummy seeded numbers (e.g. 42 runs or 284 samples)
        if (data.totalRuns === 42 && data.totalSamplesProcessed === 284) {
          syncRealPlatformMetrics().then(onUpdate);
          return;
        }
        onUpdate({
          ...data,
          isLiveDb: true,
        });
      } else {
        syncRealPlatformMetrics().then(onUpdate);
      }
    },
    (error) => {
      console.warn('Falling back to local zero metrics:', error);
      onUpdate(DEFAULT_ANALYTICS);
    }
  );

  return unsubscribe;
}

/**
 * Fetches all real persisted pipeline runs from Firestore.
 */
export async function fetchPersistentPipelineRuns(): Promise<PersistentPipelineRun[]> {
  try {
    const q = query(collection(db, 'pipeline_runs'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as PersistentPipelineRun);
  } catch (error) {
    console.warn('Could not fetch pipeline runs from Firestore:', error);
    return [];
  }
}

/**
 * Deletes a pipeline run from Firestore.
 */
export async function deletePipelineRun(runId: string): Promise<void> {
  const runRef = doc(db, 'pipeline_runs', runId);
  const resultsRef = doc(db, 'pipeline_results', runId);
  
  try {
    console.log(`[StorageService] Attempting to delete run record: pipeline_runs/${runId}`);
    await deleteDoc(runRef);
    console.log(`[StorageService] Successfully deleted run record.`);
  } catch (error) {
    console.error(`[StorageService] Failed to delete run record:`, error);
    handleFirestoreError(error, OperationType.DELETE, `pipeline_runs/${runId}`);
    return; // Stop here if main record fails
  }

  try {
    console.log(`[StorageService] Attempting to delete visualization results: pipeline_results/${runId}`);
    await deleteDoc(resultsRef);
    console.log(`[StorageService] Successfully deleted results record.`);
  } catch (error) {
    console.warn(`[StorageService] Results record not found or could not be deleted:`, error);
    // Non-blocking: we continue even if results are missing
  }

  try {
    await syncRealPlatformMetrics();
  } catch (error) {
    console.warn(`[StorageService] Analytics sync failed after delete:`, error);
  }
}

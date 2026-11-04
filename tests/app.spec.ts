import { test, expect } from '@playwright/test';

test.describe('MicrobiomeXpress End-to-End Tests', () => {
  test('landing page loads and transitions to studio', async ({ page }) => {
    await page.goto('/');
    
    // Check landing page title & hero
    await expect(page.locator('h1')).toContainText('MicrobiomeXpress');
    
    // Click Launch Studio
    const launchButton = page.locator('button:has-text("Launch Studio")').first();
    await launchButton.click();
    
    // Check that interactive tour or studio header loaded
    await expect(page.locator('text=Studio Interactive Tour')).toBeVisible();
  });

  test('studio app navigation and cohort switcher', async ({ page }) => {
    await page.goto('/');
    
    // Launch studio and skip tour
    await page.locator('button:has-text("Launch Studio")').first().click();
    const skipButton = page.locator('button:has-text("Skip Tour")');
    if (await skipButton.isVisible()) {
      await skipButton.click();
    }
    
    // Verify studio header is present
    await expect(page.locator('text=MicrobiomeXpress').first()).toBeVisible();
    
    // Click Soil cohort button
    await page.click('button:text("Soil Rhizosphere")');
    await expect(page.locator('text=SOIL-RHIZO-2026')).toBeVisible();
    
    // Click Taxa bar plot tab
    await page.click('button:has-text("Taxa Bar Plot")');
    await expect(page.locator('text=Phylum Relative Abundance')).toBeVisible();
  });
});

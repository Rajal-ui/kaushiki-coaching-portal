import { test, expect } from '@playwright/test';

test.describe('Enrollment & Payment Flow', () => {
  test('Public can view tracks and programs page', async ({ page }) => {
    await page.goto('/');
    await page.locator('#programs').scrollIntoViewIfNeeded();
    await expect(page.locator('text=Our Academic Tracks')).toBeVisible();
    await expect(page.locator('text=Classes 1–5')).toBeVisible();
    await expect(page.locator('text=CA Foundation & Intermediate')).toBeVisible();
  });

  test('Inquiry form submission works', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await page.fill('input[placeholder="e.g. Rahul Sharma"]', 'Test User');
    await page.fill('input[placeholder="10-digit number"]', '9876543210');
    await page.selectOption('select', 'CLASSES_6_10');
    await page.click('button:has-text("Submit Lead Inquiry")');
    await expect(page.locator('text=Thank you!')).toBeVisible({ timeout: 10000 });
  });

  test('Enroll page requires auth', async ({ page }) => {
    await page.goto('/enroll');
    await expect(page).toHaveURL(/\/login/);
  });
});

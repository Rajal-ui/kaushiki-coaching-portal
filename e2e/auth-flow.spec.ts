import { test, expect } from '@playwright/test';

test.describe('Auth Flows', () => {
  test('Landing page loads and shows hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Learn. Grow. Excel.');
    await expect(page.locator('text=Admissions Open')).toBeVisible();
  });

  test('Login page shows all auth modes', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('text=Welcome Back')).toBeVisible();
    await expect(page.locator('text=Phone & OTP')).toBeVisible();
    await expect(page.locator('text=Password')).toBeVisible();
    await expect(page.locator('text=Continue with Google')).toBeVisible();
  });

  test('Signup page has role selector', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('text=Create your account')).toBeVisible();
    await expect(page.locator('text=Student')).toBeVisible();
    await expect(page.locator('text=Parent')).toBeVisible();
    await expect(page.locator('text=Faculty')).toBeVisible();
    await expect(page.locator('text=Continue with Google')).toBeVisible();
  });

  test('Unauthenticated redirect to login', async ({ page }) => {
    await page.goto('/dashboard/student');
    await expect(page).toHaveURL(/\/login/);
  });
});

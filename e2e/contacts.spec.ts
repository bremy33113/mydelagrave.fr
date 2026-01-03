import { test, expect } from '@playwright/test';
import { login, clearAuth } from './helpers';

test.describe('Contacts Page', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page);
        await page.getByRole('link', { name: /contacts/i }).click();
        await expect(page).toHaveURL(/#\/contacts/);
    });

    test('should display contacts list', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /contacts/i })).toBeVisible();
    });

    test('should open create contact modal', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau contact/i }).click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();
    });

    test('should have required entreprise field in contact form', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau contact/i }).click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();

        // Check that entreprise field exists and is required
        const entrepriseInput = page.locator('input[required]').first();
        await expect(entrepriseInput).toBeVisible();
    });

    test('should not close contact modal on outside click', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau contact/i }).click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();

        // Click on backdrop (outside modal) - the modal should NOT close
        await page.locator('.modal-backdrop').click({ position: { x: 10, y: 10 } });

        // Modal should still be visible
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();
    });

    test('should close contact modal on cancel button', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau contact/i }).click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();

        await page.getByRole('button', { name: /annuler/i }).click();

        await expect(page.getByRole('heading', { name: /nouveau contact/i })).not.toBeVisible();
    });

    test('should have address map button in contact form', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau contact/i }).click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();

        // Check for map button (using svg icon selector)
        const mapButton = page.locator('button').filter({ has: page.locator('svg') }).last();
        await expect(mapButton).toBeVisible();
    });
});


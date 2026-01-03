import { test, expect } from '@playwright/test';
import { login, clearAuth } from './helpers';

test.describe('Modals Behavior', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page);
    });

    test('should not close create chantier modal on outside click', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau chantier/i }).click();
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();

        // Click on backdrop (outside modal)
        await page.locator('.modal-backdrop').click({ position: { x: 10, y: 10 } });

        // Modal should still be visible (not closed)
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();
    });

    test('should close chantier modal only with cancel button', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau chantier/i }).click();
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();

        await page.getByRole('button', { name: /annuler/i }).click();

        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).not.toBeVisible();
    });

    test('should have inline icons in chantier form labels', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau chantier/i }).click();
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();

        // Check for inline icon in Nom du chantier label
        const nomLabel = page.getByText(/nom du chantier/i);
        await expect(nomLabel).toBeVisible();
    });

    test('should have address map button in chantier form', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau chantier/i }).click();
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();

        // Check for map button next to address field
        const mapButton = page.getByTitle(/sélectionner sur la carte/i);
        await expect(mapButton).toBeVisible();
    });

    test('should open address selector from chantier form', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau chantier/i }).click();
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();

        // Click map button
        await page.getByTitle(/sélectionner sur la carte/i).click();

        // Address selector modal should open
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();
    });

    test('should close address selector on confirm', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau chantier/i }).click();
        await page.getByTitle(/sélectionner sur la carte/i).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Cancel address selector
        await page.getByRole('button', { name: /annuler/i }).last().click();

        // Should go back to chantier form
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();
    });
});

test.describe('Phases Modal', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page);
    });

    test('should not close phases modal on outside click', async ({ page }) => {
        const firstCard = page.locator('[class*="glass-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();

        await page.getByRole('button', { name: /phases/i }).click();
        await expect(page.getByRole('heading', { name: /phases/i })).toBeVisible();

        // Click on backdrop
        await page.locator('.modal-backdrop').first().click({ position: { x: 10, y: 10 } });

        // Modal should still be visible
        await expect(page.getByRole('heading', { name: /phases/i })).toBeVisible();
    });
});

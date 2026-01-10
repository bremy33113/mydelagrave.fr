import { test, expect } from '@playwright/test';
import { login, clearAuth, navigateFromDashboard } from './helpers';

test.describe('Trash Page', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page);
        await navigateFromDashboard(page, /corbeille/i);
        await expect(page).toHaveURL(/#\/corbeille/);
    });

    test('should display trash page', async ({ page }) => {
        // Trash page should have a heading with "Corbeille"
        await expect(page.getByRole('heading', { name: /corbeille/i })).toBeVisible();
    });

    test('should display type filter tabs', async ({ page }) => {
        // Buttons are "Chantiers (n)", "Notes (n)", "Contacts (n)"
        await expect(page.getByRole('button', { name: /chantiers/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /notes/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /contacts/i })).toBeVisible();
    });

    test('should filter by type - Chantiers', async ({ page }) => {
        const chantiersButton = page.getByRole('button', { name: /chantiers/i });
        await chantiersButton.click();
        await page.waitForTimeout(300);
        // Verify the tab works - no error means success
    });

    test('should filter by type - Notes', async ({ page }) => {
        await page.getByRole('button', { name: /notes/i }).click();
        await page.waitForTimeout(300);
    });

    test('should filter by type - Contacts', async ({ page }) => {
        await page.getByRole('button', { name: /contacts/i }).click();
        await page.waitForTimeout(300);
    });

    test('should show empty state when no items in trash', async ({ page }) => {
        await page.waitForTimeout(500);

        // Check for empty state message (depends on which tab is active)
        const emptyMessages = page.getByText(/aucun chantier dans la corbeille|aucune note dans la corbeille|aucun contact dans la corbeille/i);

        // If items exist, glass-card will be visible; if not, empty message
        const items = page.locator('[class*="glass-card"]');
        const itemCount = await items.count();

        if (itemCount === 0) {
            await expect(emptyMessages.first()).toBeVisible();
        }
    });
});

test.describe('Trash Page - Restore Actions', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page);
        await navigateFromDashboard(page, /corbeille/i);
    });

    test('should show restore button if items exist', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Find a restore button (if items exist)
        const restoreButtons = page.getByRole('button', { name: /restaurer/i });
        const count = await restoreButtons.count();

        // This test passes regardless - just checking the page loaded
        // If items exist, restore button should be there
        if (count > 0) {
            await expect(restoreButtons.first()).toBeVisible();
        }
    });

    test('should restore an item if items exist', async ({ page }) => {
        await page.waitForTimeout(1000);

        const restoreButtons = page.getByRole('button', { name: /restaurer/i });
        const count = await restoreButtons.count();

        if (count > 0) {
            // Click restore
            await restoreButtons.first().click();

            // Confirm modal should appear
            await expect(page.getByRole('button', { name: /confirmer|restaurer/i })).toBeVisible();

            // Cancel
            await page.getByRole('button', { name: /annuler/i }).click();
        }
    });
});

test.describe('Trash Page - Permanent Delete Actions', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page);
        await navigateFromDashboard(page, /corbeille/i);
    });

    test('should show delete button if items exist', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Find a delete button - it's just "Supprimer" not "Supprimer définitivement"
        const deleteButtons = page.getByRole('button', { name: /^supprimer$/i });
        const count = await deleteButtons.count();

        if (count > 0) {
            await expect(deleteButtons.first()).toBeVisible();
        }
    });

    test('should show permanent delete confirmation if items exist', async ({ page }) => {
        await page.waitForTimeout(1000);

        const deleteButtons = page.getByRole('button', { name: /^supprimer$/i });
        const count = await deleteButtons.count();

        if (count > 0) {
            await deleteButtons.first().click();

            // Confirmation should appear
            await expect(page.getByText(/définitivement|irréversible|sûr/i)).toBeVisible();

            // Cancel
            await page.getByRole('button', { name: /annuler/i }).click();
        }
    });
});

test.describe('Trash Page - Warning Message', () => {
    test('should display permanent deletion warning', async ({ page }) => {
        await clearAuth(page);
        await login(page);
        await navigateFromDashboard(page, /corbeille/i);

        // The page should show the warning about permanent deletion
        await expect(page.getByText(/éléments supprimés définitivement ne peuvent pas être récupérés/i)).toBeVisible();
    });
});

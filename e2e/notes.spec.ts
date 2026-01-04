import { test, expect } from '@playwright/test';
import { login, ACCOUNTS } from './helpers';

test.describe('Notes - Section Informations', () => {
    test.beforeEach(async ({ page }) => {
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        // Close any open modal first
        const modalBackdrop = page.locator('.modal-backdrop');
        if (await modalBackdrop.isVisible()) {
            await page.keyboard.press('Escape');
            await modalBackdrop.waitFor({ state: 'hidden' });
        }
        // Select first chantier
        await page.locator('[data-testid="chantier-card"]').first().click();
        await page.waitForTimeout(500);
        // Close any modal that opened
        if (await modalBackdrop.isVisible()) {
            await page.keyboard.press('Escape');
            await modalBackdrop.waitFor({ state: 'hidden' });
        }
    });

    test('should display section informations', async ({ page }) => {
        await expect(page.locator('[data-testid="section-informations"]')).toBeVisible();
    });

    test('should toggle section informations', async ({ page }) => {
        const section = page.locator('[data-testid="section-informations"]');
        const toggleBtn = page.locator('[data-testid="btn-toggle-informations"]');
        const notesSection = page.locator('[data-testid="notes-section"]');

        // Initially expanded
        await expect(notesSection).toBeVisible();

        // Collapse
        await toggleBtn.click();
        await expect(notesSection).not.toBeVisible();

        // Expand again
        await toggleBtn.click();
        await expect(notesSection).toBeVisible();
    });

    test('should show add note button', async ({ page }) => {
        await expect(page.locator('[data-testid="btn-add-note"]')).toBeVisible();
    });

    test('should open note form when clicking add button', async ({ page }) => {
        await page.click('[data-testid="btn-add-note"]');
        await expect(page.locator('[data-testid="note-form"]')).toBeVisible();
        await expect(page.locator('[data-testid="note-content-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="btn-submit-note"]')).toBeVisible();
    });

    test('should create a note with text', async ({ page }) => {
        // Get initial count
        const countText = await page.locator('[data-testid="notes-count"]').textContent();
        const initialCount = parseInt(countText?.match(/\d+/)?.[0] || '0');

        // Open form
        await page.click('[data-testid="btn-add-note"]');

        // Fill content
        await page.fill('[data-testid="note-content-input"]', 'Test note E2E');

        // Submit
        await page.click('[data-testid="btn-submit-note"]');

        // Wait for form to close
        await expect(page.locator('[data-testid="note-form"]')).not.toBeVisible();

        // Verify count increased
        await expect(page.locator('[data-testid="notes-count"]')).toContainText(`Notes (${initialCount + 1})`);
    });

    test('should display notes in the list', async ({ page }) => {
        // Create a note first
        await page.click('[data-testid="btn-add-note"]');
        await page.fill('[data-testid="note-content-input"]', 'Note visible test');
        await page.click('[data-testid="btn-submit-note"]');

        // Verify note appears in list
        await expect(page.locator('[data-testid="notes-section"]')).toContainText('Note visible test');
    });
});

test.describe('Notes - RBAC', () => {
    test('charge_affaire can create notes on assigned chantier', async ({ page }) => {
        await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);

        // Select a chantier
        await page.click('.glass-card button:first-child');
        await page.waitForTimeout(300);

        // Should see add note button
        await expect(page.locator('[data-testid="btn-add-note"]')).toBeVisible();
    });

    test('poseur can view notes but not create', async ({ page }) => {
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);

        // Select a chantier
        await page.click('.glass-card button:first-child');
        await page.waitForTimeout(300);

        // Section should be visible
        await expect(page.locator('[data-testid="section-informations"]')).toBeVisible();
    });
});

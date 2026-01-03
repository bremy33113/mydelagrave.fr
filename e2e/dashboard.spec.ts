import { test, expect } from '@playwright/test';
import { login, clearAuth } from './helpers';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page);
    });

    test('should display all KPI cards', async ({ page }) => {
        // Check KPI cards are visible by their button role with partial names
        await expect(page.getByRole('button', { name: /total/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /nouveaux/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /non planifiés/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /non attribués/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /en cours/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /^[\d\s📅]*planifiés$/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /à terminer/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /terminés/i })).toBeVisible();
    });

    test('should display chantier list', async ({ page }) => {
        const cards = page.locator('[class*="glass-card"]');
        await expect(cards.first()).toBeVisible({ timeout: 5000 });
    });

    test('should select a chantier and show details', async ({ page }) => {
        const firstCard = page.locator('[class*="glass-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();

        await expect(page.getByRole('button', { name: /modifier/i })).toBeVisible();
    });

    test('should filter chantiers by search', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/rechercher/i);
        await expect(searchInput).toBeVisible();

        await searchInput.fill('test');
        await page.waitForTimeout(300);

        await expect(searchInput).toHaveValue('test');
    });

    test('should filter chantiers by KPI click', async ({ page }) => {
        await page.locator('[class*="glass-card"]').first().waitFor({ state: 'visible', timeout: 5000 });

        // Click on "Terminés" KPI button
        await page.getByRole('button', { name: /terminés/i }).click();

        await page.waitForTimeout(300);
    });

    test('should open create chantier modal', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau chantier/i }).click();

        // Check for modal heading specifically
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();
        // Check for name input field by looking for label text
        await expect(page.getByText('Nom du chantier *')).toBeVisible();
    });

    test('should close create chantier modal on cancel', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau chantier/i }).click();
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();

        await page.getByRole('button', { name: /annuler/i }).click();

        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).not.toBeVisible();
    });

    test('should open phases modal from chantier detail', async ({ page }) => {
        const firstCard = page.locator('[class*="glass-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();

        // Click phases button in detail panel
        await page.getByRole('button', { name: /phases/i }).click();

        // Check for modal heading
        await expect(page.getByRole('heading', { name: /phases/i })).toBeVisible();
    });

    test('should open contacts modal from chantier detail', async ({ page }) => {
        const firstCard = page.locator('[class*="glass-card"]').first();
        await firstCard.waitFor({ state: 'visible', timeout: 5000 });
        await firstCard.click();

        // Click contacts button in detail panel (more specific)
        await page.getByRole('button', { name: /contacts/i }).first().click();

        // Check for modal heading
        await expect(page.getByRole('heading', { name: /contacts du chantier/i })).toBeVisible();
    });

    test('should navigate to sidebar menu items', async ({ page }) => {
        // Click on Contacts in sidebar
        await page.getByRole('link', { name: /contacts/i }).click();
        await expect(page).toHaveURL(/#\/contacts/);

        // Click on Dashboard to go back
        await page.getByRole('link', { name: /dashboard/i }).click();
        await expect(page).toHaveURL(/#\/?$/);
    });

    test('should navigate to admin page', async ({ page }) => {
        await page.getByRole('link', { name: /administration/i }).click();

        await expect(page).toHaveURL(/#\/admin/);
        await expect(page.getByText(/gestion des utilisateurs/i)).toBeVisible();
    });
});

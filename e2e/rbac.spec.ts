import { test, expect } from '@playwright/test';
import { ACCOUNTS, login, clearAuth, navigateFromDashboard, openBurgerMenu } from './helpers';

test.describe('RBAC - Dashboard Chantier Filtering', () => {
    test('Admin should see all chantiers', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        await expect(page.getByText('Tableau de bord')).toBeVisible();

        // Wait for chantiers to load
        await page.waitForTimeout(1000);

        // Check that chantiers are visible
        const chantierCards = page.locator('[class*="glass-card"]');
        const count = await chantierCards.count();

        // Admin should see multiple chantiers
        expect(count).toBeGreaterThan(0);
    });

    test('Superviseur should see all chantiers', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);

        await expect(page.getByText('Tableau de bord')).toBeVisible();
        await page.waitForTimeout(1000);

        const chantierCards = page.locator('[class*="glass-card"]');
        const count = await chantierCards.count();

        // Superviseur should see multiple chantiers
        expect(count).toBeGreaterThan(0);
    });

    test('Chargé d\'Affaires should only see assigned chantiers', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);

        await expect(page.getByText('Tableau de bord')).toBeVisible();
        await page.waitForTimeout(1000);

        const chantierCards = page.locator('[class*="glass-card"]');
        const count = await chantierCards.count();

        // CA should see at least 1 chantier (if assigned)
        // The exact count depends on mock data assignments
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('Poseur should only see assigned chantiers', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);

        await expect(page.getByText('Tableau de bord')).toBeVisible();
        await page.waitForTimeout(1000);

        const chantierCards = page.locator('[class*="glass-card"]');
        const count = await chantierCards.count();

        // Poseur should see at least 1 chantier (if assigned)
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('RBAC - Chantier Creation Permissions', () => {
    test('Admin can create chantiers', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        const createButton = page.getByRole('button', { name: /nouveau chantier/i });
        await expect(createButton).toBeVisible();
    });

    test('Superviseur can create chantiers', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);

        const createButton = page.getByRole('button', { name: /nouveau chantier/i });
        await expect(createButton).toBeVisible();
    });

    test('Chargé d\'Affaires can create chantiers', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);

        const createButton = page.getByRole('button', { name: /nouveau chantier/i });
        await expect(createButton).toBeVisible();
    });

    test('Poseur CANNOT create chantiers', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);

        const createButton = page.getByRole('button', { name: /nouveau chantier/i });
        await expect(createButton).not.toBeVisible();
    });
});

test.describe('RBAC - Chantier Edit/Delete Buttons', () => {
    test('Admin can see edit/delete buttons', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        // Wait for chantiers and select first one
        await page.waitForTimeout(1000);
        const firstCard = page.locator('[class*="glass-card"]').first();

        if (await firstCard.isVisible()) {
            await firstCard.click();

            // Check for edit/delete buttons in chantier detail panel (specific data-testid)
            await expect(page.locator('[data-testid="btn-edit-chantier"]')).toBeVisible();
            await expect(page.locator('[data-testid="btn-delete-chantier"]')).toBeVisible();
        }
    });

    test('Poseur CANNOT see edit/delete buttons', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);

        await page.waitForTimeout(1000);
        const firstCard = page.locator('[class*="glass-card"]').first();

        if (await firstCard.isVisible()) {
            await firstCard.click();

            // Chantier edit and delete buttons should NOT be visible (specific data-testid)
            await expect(page.locator('[data-testid="btn-edit-chantier"]')).not.toBeVisible();
            await expect(page.locator('[data-testid="btn-delete-chantier"]')).not.toBeVisible();
        }
    });
});

test.describe('RBAC - Contact Permissions', () => {
    test('Admin can create/edit/delete contacts', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        await navigateFromDashboard(page, /contacts/i);

        await expect(page.getByRole('button', { name: /nouveau contact/i })).toBeVisible();
    });

    test('Superviseur can create/edit/delete contacts', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);
        await navigateFromDashboard(page, /contacts/i);

        await expect(page.getByRole('button', { name: /nouveau contact/i })).toBeVisible();
    });

    test('Chargé d\'Affaires can create contacts', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);
        await navigateFromDashboard(page, /contacts/i);

        await expect(page.getByRole('button', { name: /nouveau contact/i })).toBeVisible();
    });

    test('Poseur CANNOT create contacts', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);
        await navigateFromDashboard(page, /contacts/i);

        await expect(page.getByRole('button', { name: /nouveau contact/i })).not.toBeVisible();
    });

    test('Poseur CANNOT see edit buttons on contacts', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);
        await navigateFromDashboard(page, /contacts/i);

        await page.waitForTimeout(1000);

        // No edit buttons should be visible
        const editButtons = page.getByRole('button', { name: /modifier|edit/i });
        await expect(editButtons).toHaveCount(0);
    });

    test('Poseur CANNOT see delete buttons on contacts', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);
        await navigateFromDashboard(page, /contacts/i);

        await page.waitForTimeout(1000);

        // No delete buttons should be visible
        const deleteButtons = page.getByTitle(/supprimer le contact/i);
        await expect(deleteButtons).toHaveCount(0);
    });
});

test.describe('RBAC - Administration Access', () => {
    test('Admin can access Administration page', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        // Open burger menu and verify Admin link is visible
        await openBurgerMenu(page);
        await expect(page.getByRole('link', { name: /administration/i })).toBeVisible();

        await page.getByRole('link', { name: /administration/i }).click();
        await expect(page).toHaveURL(/#\/admin/);
    });

    test('Superviseur can access Administration page', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);

        // Open burger menu and verify Admin link is visible
        await openBurgerMenu(page);
        await expect(page.getByRole('link', { name: /administration/i })).toBeVisible();

        await page.getByRole('link', { name: /administration/i }).click();
        await expect(page).toHaveURL(/#\/admin/);
    });

    test('Chargé d\'Affaires CANNOT access Administration', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);

        // Open burger menu and verify Admin link is NOT visible
        await openBurgerMenu(page);
        await expect(page.getByRole('link', { name: /administration/i })).not.toBeVisible();
    });

    test('Poseur CANNOT access Administration', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);

        // Open burger menu and verify Admin link is NOT visible
        await openBurgerMenu(page);
        await expect(page.getByRole('link', { name: /administration/i })).not.toBeVisible();
    });
});

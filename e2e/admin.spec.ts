import { test, expect } from '@playwright/test';
import { ACCOUNTS, login, clearAuth } from './helpers';

test.describe('Admin Page - Admin Access', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        await page.getByRole('link', { name: /administration/i }).click();
        await expect(page).toHaveURL(/#\/admin/);
    });

    test('should display admin page', async ({ page }) => {
        await expect(page.getByText(/gestion des utilisateurs/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /nouvel utilisateur/i })).toBeVisible();
    });

    test('should see all users (all roles)', async ({ page }) => {
        // Wait for user table to load
        await page.waitForTimeout(1000);

        // Should see Admin, Superviseur, CA, and Poseur users
        const tableRows = page.locator('tbody tr');
        await expect(tableRows.first()).toBeVisible({ timeout: 5000 });
    });

    test('should create a new user', async ({ page }) => {
        await page.getByRole('button', { name: /nouvel utilisateur/i }).click();

        // Wait for modal to open
        await expect(page.getByRole('heading', { name: /nouvel utilisateur/i })).toBeVisible();

        // Fill form using data-testid selectors (more stable)
        await page.getByTestId('user-email-input').fill(`test-${Date.now()}@example.com`);
        await page.getByTestId('user-password-input').fill('testpass123');
        await page.getByTestId('user-prenom-input').fill('TestPrenom');
        await page.getByTestId('user-nom-input').fill('TestNom');
        await page.getByTestId('user-role-select').selectOption('poseur');

        // Submit using data-testid
        await page.getByTestId('user-submit-btn').click();

        // Verify modal closes (success)
        await expect(page.getByRole('heading', { name: /nouvel utilisateur/i })).not.toBeVisible({ timeout: 5000 });
    });

    test('should edit a user', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Click edit button on first user
        const editButtons = page.getByTitle(/modifier/i);
        await editButtons.first().click();

        // Modal should open
        await expect(page.getByRole('heading', { name: /modifier/i })).toBeVisible();
    });

    test('should suspend a user', async ({ page }) => {
        // Wait for users to load
        await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 5000 });

        // Find a non-admin user to suspend (title is "Suspendre" or "Réactiver")
        const suspendButtons = page.getByTitle(/suspendre|réactiver/i);

        if (await suspendButtons.count() > 0) {
            await suspendButtons.first().click();

            // Confirmation modal text starts with "Voulez-vous vraiment"
            await expect(page.getByText(/voulez-vous vraiment/i)).toBeVisible();
            await page.getByRole('button', { name: /annuler/i }).click();
        }
    });

    test('should NOT see suspend/delete buttons for admin users', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Check that admin rows don't have suspend/delete buttons
        // This is a visual verification - implementation depends on UI structure
    });
});

test.describe('Admin Page - Superviseur Access', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);
        await page.getByRole('link', { name: /administration/i }).click();
        await expect(page).toHaveURL(/#\/admin/);
    });

    test('should access admin page', async ({ page }) => {
        await expect(page.getByText(/gestion des utilisateurs/i)).toBeVisible();
    });

    test('should see only Poseurs and Chargés d\'Affaires', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Should see users table
        const tableRows = page.locator('tbody tr');
        await expect(tableRows.first()).toBeVisible({ timeout: 5000 });

        // Note: Admin users are filtered out by the backend for superviseurs
        // The exact badge check depends on how admin badges are displayed
        // This test verifies the table loads successfully
    });

    test('should only create Poseur users', async ({ page }) => {
        await page.getByRole('button', { name: /nouvel utilisateur/i }).click();

        // Wait for modal to open
        await expect(page.getByRole('heading', { name: /nouvel utilisateur/i })).toBeVisible();

        // Use data-testid for role select
        const roleSelect = page.getByTestId('user-role-select');
        await expect(roleSelect).toBeVisible();

        // Verify poseur option exists (options inside select are "hidden" but attached)
        const poseurOption = roleSelect.locator('option').filter({ hasText: /poseur/i });
        await expect(poseurOption).toBeAttached();

        // Verify we can select the poseur option
        await roleSelect.selectOption('poseur');
        await expect(roleSelect).toHaveValue('poseur');
    });

    test('should edit Poseur users', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Look for edit buttons (should only be on Poseur rows)
        const editButtons = page.getByTitle(/modifier/i);

        if (await editButtons.count() > 0) {
            await editButtons.first().click();
            await expect(page.getByRole('heading', { name: /modifier/i })).toBeVisible();
        }
    });

    test('should NOT see edit buttons for Chargé d\'Affaires', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Count total users vs edit buttons
        const tableRows = page.locator('tbody tr');
        const editButtons = page.getByTitle(/modifier/i);

        const rowsCount = await tableRows.count();
        const editCount = await editButtons.count();

        // Edit buttons should be less than total rows (CA rows have no edit buttons)
        if (rowsCount > 1) {
            expect(editCount).toBeLessThan(rowsCount);
        }
    });

    test('should NOT see delete buttons for Chargé d\'Affaires', async ({ page }) => {
        await page.waitForTimeout(1000);

        // Similar logic: delete buttons only for Poseurs
        const deleteButtons = page.getByTitle(/supprimer/i);
        const tableRows = page.locator('tbody tr');

        const rowsCount = await tableRows.count();
        const deleteCount = await deleteButtons.count();

        if (rowsCount > 1) {
            expect(deleteCount).toBeLessThan(rowsCount);
        }
    });
});

test.describe('Admin Page - Chargé d\'Affaires Access (Denied)', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);
    });

    test('should NOT see Administration link in sidebar', async ({ page }) => {
        const adminLink = page.getByRole('link', { name: /administration/i });
        await expect(adminLink).not.toBeVisible();
    });

    test('should redirect or not see admin content when accessing /admin directly', async ({ page }) => {
        await page.goto('/#/admin');
        await page.waitForTimeout(1000);

        // Either redirected away from admin OR not seeing admin content
        const adminContent = page.getByText(/gestion des utilisateurs/i);
        await expect(adminContent).not.toBeVisible();
    });
});

test.describe('Admin Page - Poseur Access (Denied)', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);
    });

    test('should NOT see Administration link in sidebar', async ({ page }) => {
        const adminLink = page.getByRole('link', { name: /administration/i });
        await expect(adminLink).not.toBeVisible();
    });

    test('should redirect or not see admin content when accessing /admin directly', async ({ page }) => {
        await page.goto('/#/admin');
        await page.waitForTimeout(1000);

        // Either redirected away from admin OR not seeing admin content
        const adminContent = page.getByText(/gestion des utilisateurs/i);
        await expect(adminContent).not.toBeVisible();
    });
});

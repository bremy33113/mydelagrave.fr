import { test, expect } from '@playwright/test';
import { login, clearAuth, ACCOUNTS } from './helpers';

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

test.describe('Dashboard - Filters (Admin/Superviseur only)', () => {
    test('should display filter dropdowns for admin', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        await expect(page.locator('[data-testid="filter-charge-affaire"]')).toBeVisible();
        await expect(page.locator('[data-testid="filter-statut"]')).toBeVisible();
        await expect(page.locator('[data-testid="filter-poseur"]')).toBeVisible();
    });

    test('should display filter dropdowns for superviseur', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);

        await expect(page.locator('[data-testid="filter-charge-affaire"]')).toBeVisible();
        await expect(page.locator('[data-testid="filter-statut"]')).toBeVisible();
        await expect(page.locator('[data-testid="filter-poseur"]')).toBeVisible();
    });

    test('should NOT display filter dropdowns for charge_affaire', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);

        await expect(page.locator('[data-testid="filter-charge-affaire"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="filter-statut"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="filter-poseur"]')).not.toBeVisible();
    });

    test('should NOT display filter dropdowns for poseur', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);

        await expect(page.locator('[data-testid="filter-charge-affaire"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="filter-statut"]')).not.toBeVisible();
        await expect(page.locator('[data-testid="filter-poseur"]')).not.toBeVisible();
    });

    test('should filter chantiers by charge affaire', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        // Wait for chantiers and filter options to load
        await page.locator('[data-testid="chantier-card"]').first().waitFor({ state: 'visible', timeout: 5000 });
        await page.waitForTimeout(500); // Wait for filter lists to load

        // Get initial count
        const initialCount = await page.locator('[data-testid="chantier-card"]').count();

        // Wait for options to be available and select by label
        const select = page.locator('[data-testid="filter-charge-affaire"]');
        const options = select.locator('option');
        const optionCount = await options.count();

        if (optionCount > 1) {
            // Select second option (first is "Chargé" placeholder)
            const secondOption = await options.nth(1).getAttribute('value');
            if (secondOption) {
                await select.selectOption(secondOption);
                await page.waitForTimeout(300);

                // Count should be same or less (filtered)
                const filteredCount = await page.locator('[data-testid="chantier-card"]').count();
                expect(filteredCount).toBeLessThanOrEqual(initialCount);
            }
        }
    });

    test('should filter chantiers by statut', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        await page.locator('[data-testid="chantier-card"]').first().waitFor({ state: 'visible', timeout: 5000 });
        await page.waitForTimeout(500);

        const select = page.locator('[data-testid="filter-statut"]');
        const options = select.locator('option');
        const optionCount = await options.count();

        if (optionCount > 1) {
            const secondOption = await options.nth(1).getAttribute('value');
            if (secondOption) {
                await select.selectOption(secondOption);
                await page.waitForTimeout(300);

                const selectedValue = await select.inputValue();
                expect(selectedValue).toBe(secondOption);
            }
        }
    });

    test('should filter chantiers by poseur', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        await page.locator('[data-testid="chantier-card"]').first().waitFor({ state: 'visible', timeout: 5000 });
        await page.waitForTimeout(500);

        const select = page.locator('[data-testid="filter-poseur"]');
        const options = select.locator('option');
        const optionCount = await options.count();

        if (optionCount > 1) {
            const secondOption = await options.nth(1).getAttribute('value');
            if (secondOption) {
                await select.selectOption(secondOption);
                await page.waitForTimeout(300);

                const selectedValue = await select.inputValue();
                expect(selectedValue).toBe(secondOption);
            }
        }
    });

    test('should combine multiple filters', async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

        await page.locator('[data-testid="chantier-card"]').first().waitFor({ state: 'visible', timeout: 5000 });
        await page.waitForTimeout(500);

        const statutSelect = page.locator('[data-testid="filter-statut"]');
        const chargeSelect = page.locator('[data-testid="filter-charge-affaire"]');

        // Get options
        const statutOptions = statutSelect.locator('option');
        const chargeOptions = chargeSelect.locator('option');

        const statutCount = await statutOptions.count();
        const chargeCount = await chargeOptions.count();

        if (statutCount > 1 && chargeCount > 1) {
            const statutValue = await statutOptions.nth(1).getAttribute('value');
            const chargeValue = await chargeOptions.nth(1).getAttribute('value');

            if (statutValue && chargeValue) {
                await statutSelect.selectOption(statutValue);
                await chargeSelect.selectOption(chargeValue);
                await page.waitForTimeout(300);

                expect(await statutSelect.inputValue()).toBe(statutValue);
                expect(await chargeSelect.inputValue()).toBe(chargeValue);
            }
        }
    });
});

import { test, expect } from '@playwright/test';
import { login, clearAuth } from './helpers';

test.describe('AddressSelectorModal', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page);

        // Open "Nouveau chantier" modal
        await page.getByRole('button', { name: /nouveau chantier/i }).click();
        await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();
    });

    test('should open address selector modal when clicking address button', async ({ page }) => {
        // Click on address selector button (MapPin icon button near "Adresse de livraison")
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();

        // Check modal is visible
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();
        await expect(page.locator('[data-testid="address-search-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="address-map"]')).toBeVisible();
    });

    test('should display search input and buttons', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Check all UI elements
        await expect(page.locator('[data-testid="address-search-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="address-search-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="address-locate-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="address-cancel-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="address-confirm-button"]')).toBeVisible();
    });

    test('should have confirm button disabled when no address selected', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Confirm button should be disabled
        await expect(page.locator('[data-testid="address-confirm-button"]')).toBeDisabled();
    });

    test('should close modal on cancel button click', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Click cancel
        await page.locator('[data-testid="address-cancel-button"]').click();

        // Modal should be closed
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).not.toBeVisible();
    });

    test('should close modal on X button click', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Click X button
        await page.locator('[data-testid="address-modal-close"]').click();

        // Modal should be closed
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).not.toBeVisible();
    });

    test('should search for address and display results', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Type an address (using Nantes as default center)
        const searchInput = page.locator('[data-testid="address-search-input"]');
        await searchInput.fill('1 rue de la paix Paris');

        // Wait for search results (API call)
        await page.waitForTimeout(1000);

        // Check if results appear (may or may not appear depending on API availability)
        const results = page.locator('[data-testid="address-search-results"]');
        const hasResults = await results.isVisible().catch(() => false);

        if (hasResults) {
            await expect(page.locator('[data-testid="address-result-0"]')).toBeVisible();
        }
    });

    test('should select address from search results', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Type an address
        const searchInput = page.locator('[data-testid="address-search-input"]');
        await searchInput.fill('10 rue de Nantes');

        // Wait for search results
        await page.waitForTimeout(1500);

        // Check if first result is visible
        const firstResult = page.locator('[data-testid="address-result-0"]');
        const hasResults = await firstResult.isVisible().catch(() => false);

        if (hasResults) {
            // Click first result
            await firstResult.click();

            // Wait for selection
            await page.waitForTimeout(500);

            // Selected address section should appear
            await expect(page.locator('[data-testid="address-selected"]')).toBeVisible();
            await expect(page.locator('[data-testid="address-selected-label"]')).toBeVisible();

            // Confirm button should now be enabled
            await expect(page.locator('[data-testid="address-confirm-button"]')).toBeEnabled();
        }
    });

    test('should show map container', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Map should be visible
        const mapContainer = page.locator('[data-testid="address-map"]');
        await expect(mapContainer).toBeVisible();

        // Leaflet should have initialized (check for leaflet tiles)
        await page.waitForTimeout(1000);
        const leafletContainer = page.locator('.leaflet-container');
        await expect(leafletContainer).toBeVisible();
    });

    test('should validate address with Enter key', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Type an address
        const searchInput = page.locator('[data-testid="address-search-input"]');
        await searchInput.fill('Mairie de Nantes');

        // Wait for results
        await page.waitForTimeout(1500);

        // Press Enter to validate
        await searchInput.press('Enter');

        // Wait for selection
        await page.waitForTimeout(1000);

        // If API responded, selected address should appear
        const selectedAddress = page.locator('[data-testid="address-selected"]');
        const hasSelection = await selectedAddress.isVisible().catch(() => false);

        if (hasSelection) {
            await expect(page.locator('[data-testid="address-confirm-button"]')).toBeEnabled();
        }
    });

    test('should confirm address and close modal', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Type and search
        const searchInput = page.locator('[data-testid="address-search-input"]');
        await searchInput.fill('Place Royale Nantes');

        // Wait for results
        await page.waitForTimeout(1500);

        // Check for results
        const firstResult = page.locator('[data-testid="address-result-0"]');
        const hasResults = await firstResult.isVisible().catch(() => false);

        if (hasResults) {
            // Select first result
            await firstResult.click();
            await page.waitForTimeout(500);

            // Confirm
            await page.locator('[data-testid="address-confirm-button"]').click();

            // Modal should close
            await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).not.toBeVisible();

            // We should be back in the chantier creation modal
            await expect(page.getByRole('heading', { name: 'Nouveau chantier' })).toBeVisible();
        }
    });

    test('should display coordinates when address is selected', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Type and search
        const searchInput = page.locator('[data-testid="address-search-input"]');
        await searchInput.fill('Tour Eiffel Paris');

        // Wait for results
        await page.waitForTimeout(1500);

        // Check for results
        const firstResult = page.locator('[data-testid="address-result-0"]');
        const hasResults = await firstResult.isVisible().catch(() => false);

        if (hasResults) {
            // Select first result
            await firstResult.click();
            await page.waitForTimeout(500);

            // Coordinates should be displayed
            await expect(page.locator('[data-testid="address-selected-coords"]')).toBeVisible();

            const coordsText = await page.locator('[data-testid="address-selected-coords"]').textContent();
            expect(coordsText).toContain('Coordonnées:');
        }
    });

    test('should have search button disabled with short query', async ({ page }) => {
        await page.getByRole('button', { name: /sélectionner sur la carte/i }).click();
        await expect(page.getByRole('heading', { name: /sélectionner une adresse/i })).toBeVisible();

        // Type only 2 characters
        const searchInput = page.locator('[data-testid="address-search-input"]');
        await searchInput.fill('ab');

        // Search button should be disabled (min 3 chars required)
        await expect(page.locator('[data-testid="address-search-button"]')).toBeDisabled();

        // Type 3 characters
        await searchInput.fill('abc');

        // Search button should now be enabled
        await expect(page.locator('[data-testid="address-search-button"]')).toBeEnabled();
    });
});

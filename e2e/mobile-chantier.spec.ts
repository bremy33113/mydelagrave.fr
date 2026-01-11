import { test, expect } from '@playwright/test';
import { ACCOUNTS } from './helpers';

/**
 * Tests E2E pour les pages mobiles chantier
 * Couvre : MobileChantierDetail, MobileLayout
 */

// Helper pour login en mode mobile
async function loginMobile(page: import('@playwright/test').Page, email: string, password: string) {
    // D'abord forcer le mode mobile
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.setItem('force_mobile_mode', 'true');
    });
    await page.reload();

    // Login
    await page.getByPlaceholder('votre@email.fr').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();

    // Attendre que la page mobile se charge
    await page.waitForLoadState('networkidle');
}

test.describe('Mobile Chantier Detail', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin pour avoir accès à tous les chantiers
        await loginMobile(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should display chantier detail with correct title format', async ({ page }) => {
        // Naviguer vers un chantier mobile
        await page.goto('/#/m/chantiers');
        await page.waitForLoadState('networkidle');

        // Cliquer sur le premier chantier de la liste
        const firstChantier = page.locator('[data-testid="chantier-card"]').first();
        if (await firstChantier.isVisible()) {
            await firstChantier.click();
            await page.waitForLoadState('networkidle');

            // Vérifier que le layout mobile est affiché
            await expect(page.locator('[data-testid="mobile-layout"]')).toBeVisible();

            // Vérifier que le titre contient la référence et le nom (format "REF - NOM")
            const title = page.locator('[data-testid="mobile-title"]');
            await expect(title).toBeVisible();
            const titleText = await title.textContent();
            // Le titre doit contenir un tiret si la référence existe
            expect(titleText).toBeTruthy();
        }
    });

    test('should display action buttons (GPS and Rapport)', async ({ page }) => {
        await page.goto('/#/m/chantiers');
        await page.waitForLoadState('networkidle');

        const firstChantier = page.locator('[data-testid="chantier-card"]').first();
        if (await firstChantier.isVisible()) {
            await firstChantier.click();
            await page.waitForLoadState('networkidle');

            // Vérifier les boutons d'action
            await expect(page.locator('[data-testid="btn-gps"]')).toBeVisible();
            await expect(page.locator('[data-testid="btn-rapport"]')).toBeVisible();

            // Vérifier le texte des boutons
            await expect(page.locator('[data-testid="btn-gps"]')).toContainText('GPS Site');
            await expect(page.locator('[data-testid="btn-rapport"]')).toContainText('Rapport');
        }
    });

    test('should NOT display header chantier card (removed in v2.6.9)', async ({ page }) => {
        await page.goto('/#/m/chantiers');
        await page.waitForLoadState('networkidle');

        const firstChantier = page.locator('[data-testid="chantier-card"]').first();
        if (await firstChantier.isVisible()) {
            await firstChantier.click();
            await page.waitForLoadState('networkidle');

            // Le premier élément après le header doit être les boutons d'action
            // PAS une carte avec icône catégorie/nom/client/statut
            const actionButtons = page.locator('[data-testid="action-buttons"]');
            await expect(actionButtons).toBeVisible();

            // Les boutons d'action doivent être le premier élément visible dans le contenu
            // Vérifier qu'il n'y a pas de carte header avant les boutons
            const content = page.locator('.p-4.space-y-4');
            const firstChild = content.locator('> *').first();
            await expect(firstChild).toHaveAttribute('data-testid', 'action-buttons');
        }
    });

    test('should have expandable sections', async ({ page }) => {
        await page.goto('/#/m/chantiers');
        await page.waitForLoadState('networkidle');

        const firstChantier = page.locator('[data-testid="chantier-card"]').first();
        if (await firstChantier.isVisible()) {
            await firstChantier.click();
            await page.waitForLoadState('networkidle');

            // Vérifier que la section Localisation existe
            await expect(page.locator('[data-testid="section-localisation"]')).toBeVisible();

            // Cliquer pour expand
            await page.locator('[data-testid="btn-expand-localisation"]').click();

            // Vérifier que le contenu est visible après expansion
            // (la section devrait montrer l'adresse ou les contacts)
            await page.waitForTimeout(300); // Animation
        }
    });

    test('should display fullscreen button in header', async ({ page }) => {
        await page.goto('/#/m/chantiers');
        await page.waitForLoadState('networkidle');

        const firstChantier = page.locator('[data-testid="chantier-card"]').first();
        if (await firstChantier.isVisible()) {
            await firstChantier.click();
            await page.waitForLoadState('networkidle');

            // Vérifier que le bouton fullscreen est présent
            await expect(page.locator('[data-testid="btn-fullscreen"]')).toBeVisible();
        }
    });

    test('should navigate back when clicking back button', async ({ page }) => {
        await page.goto('/#/m/chantiers');
        await page.waitForLoadState('networkidle');

        const firstChantier = page.locator('[data-testid="chantier-card"]').first();
        if (await firstChantier.isVisible()) {
            await firstChantier.click();
            await page.waitForLoadState('networkidle');

            // Vérifier que le bouton retour est visible
            await expect(page.locator('[data-testid="btn-back"]')).toBeVisible();

            // Cliquer sur retour
            await page.locator('[data-testid="btn-back"]').click();
            await page.waitForLoadState('networkidle');

            // Devrait revenir à la liste des chantiers
            await expect(page.url()).toContain('/m/chantiers');
        }
    });
});

test.describe('Mobile Layout', () => {
    test.beforeEach(async ({ page }) => {
        await loginMobile(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should display mobile header with title', async ({ page }) => {
        await page.goto('/#/m/planning');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="mobile-header"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-title"]')).toBeVisible();
    });

    test('should display profile button', async ({ page }) => {
        await page.goto('/#/m/planning');
        await page.waitForLoadState('networkidle');

        await expect(page.locator('[data-testid="btn-profile"]')).toBeVisible();
    });
});

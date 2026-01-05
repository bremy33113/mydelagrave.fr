import { test, expect } from '@playwright/test';
import { login, ACCOUNTS } from './helpers';

test.describe('Online Users - Présence temps réel', () => {
    test.describe('Visibilité selon le rôle', () => {
        test('admin voit la section utilisateurs en ligne', async ({ page }) => {
            await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

            // Attendre que la présence soit mise à jour (heartbeat)
            await page.waitForTimeout(2000);

            // L'admin doit voir la section "En ligne"
            const onlineSection = page.locator('[data-testid="online-users-section"]');
            await expect(onlineSection).toBeVisible();

            // Vérifier le label
            const label = page.locator('[data-testid="online-users-label"]');
            await expect(label).toContainText('En ligne');
        });

        test('superviseur voit la section utilisateurs en ligne', async ({ page }) => {
            await login(page, ACCOUNTS.superviseur.email, ACCOUNTS.superviseur.password);

            await page.waitForTimeout(2000);

            const onlineSection = page.locator('[data-testid="online-users-section"]');
            await expect(onlineSection).toBeVisible();
        });

        test('charge_affaire ne voit PAS la section utilisateurs en ligne', async ({ page }) => {
            await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);

            await page.waitForTimeout(2000);

            // La section ne doit pas être visible pour un chargé d'affaires
            const onlineSection = page.locator('[data-testid="online-users-section"]');
            await expect(onlineSection).not.toBeVisible();
        });

        test('poseur ne voit PAS la section utilisateurs en ligne', async ({ page }) => {
            await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);

            await page.waitForTimeout(2000);

            const onlineSection = page.locator('[data-testid="online-users-section"]');
            await expect(onlineSection).not.toBeVisible();
        });
    });

    test.describe('Affichage des utilisateurs', () => {
        test('affiche au moins l\'utilisateur courant', async ({ page }) => {
            await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

            await page.waitForTimeout(2000);

            // La liste doit contenir au moins un utilisateur (soi-même)
            const usersList = page.locator('[data-testid="online-users-list"]');
            await expect(usersList).toBeVisible();

            // Il doit y avoir au moins un badge utilisateur
            const userBadges = page.locator('[data-testid^="online-user-"]');
            await expect(userBadges.first()).toBeVisible();
        });

        test('le compteur affiche le nombre correct', async ({ page }) => {
            await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);

            await page.waitForTimeout(2000);

            // Le label doit contenir un nombre entre parenthèses
            const label = page.locator('[data-testid="online-users-label"]');
            await expect(label).toContainText(/En ligne \(\d+\)/);
        });
    });
});

import { test, expect } from '@playwright/test';
import { ACCOUNTS, login, clearAuth } from './helpers';

test.describe('Authentication', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
    });

    test('should display login page elements', async ({ page }) => {
        await expect(page.getByPlaceholder('votre@email.fr')).toBeVisible();
        await expect(page.getByPlaceholder('••••••••')).toBeVisible();
        await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
        await expect(page.getByText('MyDelagrave')).toBeVisible();
    });

    test('should login with admin credentials', async ({ page }) => {
        await page.getByPlaceholder('votre@email.fr').fill(ACCOUNTS.admin.email);
        await page.getByPlaceholder('••••••••').fill(ACCOUNTS.admin.password);
        await page.getByRole('button', { name: /se connecter/i }).click();

        await expect(page).toHaveURL(/#\/?$/);
        await expect(page.getByText('Tableau de bord')).toBeVisible();
    });

    test('should login with charge affaire credentials', async ({ page }) => {
        await page.getByPlaceholder('votre@email.fr').fill(ACCOUNTS.chargeAffaire.email);
        await page.getByPlaceholder('••••••••').fill(ACCOUNTS.chargeAffaire.password);
        await page.getByRole('button', { name: /se connecter/i }).click();

        await expect(page.getByText('Tableau de bord')).toBeVisible();
    });

    test('should login with superviseur credentials', async ({ page }) => {
        await page.getByPlaceholder('votre@email.fr').fill(ACCOUNTS.superviseur.email);
        await page.getByPlaceholder('••••••••').fill(ACCOUNTS.superviseur.password);
        await page.getByRole('button', { name: /se connecter/i }).click();

        await expect(page.getByText('Tableau de bord')).toBeVisible();
    });

    test('should login with poseur credentials', async ({ page }) => {
        await page.getByPlaceholder('votre@email.fr').fill(ACCOUNTS.poseur.email);
        await page.getByPlaceholder('••••••••').fill(ACCOUNTS.poseur.password);
        await page.getByRole('button', { name: /se connecter/i }).click();

        await expect(page.getByText('Tableau de bord')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.getByPlaceholder('votre@email.fr').fill('invalid@test.com');
        await page.getByPlaceholder('••••••••').fill('wrongpassword');
        await page.getByRole('button', { name: /se connecter/i }).click();

        await expect(page.getByText(/invalid login credentials/i)).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
        await login(page);
        await expect(page.getByText('Tableau de bord')).toBeVisible();

        await page.getByRole('button', { name: /déconnexion/i }).click();

        await expect(page.getByPlaceholder('votre@email.fr')).toBeVisible();
    });

    test('should persist session after page reload', async ({ page }) => {
        await login(page);
        await expect(page.getByText('Tableau de bord')).toBeVisible();

        await page.reload();

        await expect(page.getByText('Tableau de bord')).toBeVisible();
    });

    test('should redirect to login when not authenticated', async ({ page }) => {
        await page.goto('/#/admin');

        await expect(page.getByPlaceholder('votre@email.fr')).toBeVisible();
    });
});

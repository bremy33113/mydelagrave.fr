import { Page, expect } from '@playwright/test';

// Demo accounts from LoginPage.tsx
export const ACCOUNTS = {
    admin: { email: 'admin@delagrave.fr', password: 'admin123' },
    chargeAffaire: { email: 'jean.dupont@delagrave.fr', password: 'password123' },
    superviseur: { email: 'marie.martin@delagrave.fr', password: 'password123' },
    poseur: { email: 'pierre.durand@delagrave.fr', password: 'password123' },
} as const;

/**
 * Login with the specified credentials (defaults to admin)
 */
export async function login(
    page: Page,
    email: string = ACCOUNTS.admin.email,
    password: string = ACCOUNTS.admin.password
): Promise<void> {
    await page.goto('/');
    await page.getByPlaceholder('votre@email.fr').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByText('Tableau de bord')).toBeVisible();
}

/**
 * Clear auth session to reset login state
 * Only clears the session, not the mock user data
 */
export async function clearAuth(page: Page): Promise<void> {
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.removeItem('mock_auth_session');
    });
    await page.reload();
}

/**
 * Open the burger menu on the dashboard page
 * Dashboard uses a floating burger menu instead of sidebar
 */
export async function openBurgerMenu(page: Page): Promise<void> {
    const burgerButton = page.locator('[data-testid="btn-burger-menu"]');
    await burgerButton.click();
    await expect(page.locator('[data-testid="burger-menu-panel"]')).toBeVisible();
}

/**
 * Navigate to a page from the dashboard via the burger menu
 */
export async function navigateFromDashboard(page: Page, linkName: RegExp): Promise<void> {
    await openBurgerMenu(page);
    await page.getByRole('link', { name: linkName }).click();
}

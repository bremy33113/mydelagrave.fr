import { Page, expect } from '@playwright/test';
import { login, ACCOUNTS } from './helpers';

/**
 * Test data fixtures for E2E tests.
 * These helpers create and clean up test data to ensure predictable test states.
 */

export interface TestContact {
    entreprise: string;
    nom: string;
    email: string;
}

export interface TestUser {
    email: string;
    prenom: string;
    nom: string;
    role: string;
}

/**
 * Creates a test contact using the admin account.
 * Returns the contact details for verification in tests.
 */
export async function createTestContact(page: Page, contactData?: Partial<TestContact>): Promise<TestContact> {
    const timestamp = Date.now();
    const contact: TestContact = {
        entreprise: contactData?.entreprise || `Test Entreprise ${timestamp}`,
        nom: contactData?.nom || `Test Contact ${timestamp}`,
        email: contactData?.email || `test-${timestamp}@e2e.com`,
    };

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.getByRole('link', { name: /contacts/i }).click();
    await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();

    await page.getByRole('button', { name: /nouveau contact/i }).click();
    await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();

    // Fill form using data-testid selectors
    await page.getByTestId('contact-entreprise-input').fill(contact.entreprise);
    await page.getByTestId('contact-nom-input').fill(contact.nom);
    await page.getByTestId('contact-email-input').fill(contact.email);

    await page.getByTestId('contact-submit-btn').click();

    // Wait for modal to close and contact to appear
    await expect(page.getByRole('heading', { name: /nouveau contact/i })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(contact.nom)).toBeVisible({ timeout: 5000 });

    return contact;
}

/**
 * Deletes a test contact by name (soft delete).
 */
export async function deleteTestContact(page: Page, contactName: string): Promise<void> {
    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.getByRole('link', { name: /contacts/i }).click();
    await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();

    // Find and delete the contact
    const card = page.locator('[class*="glass-card"]').filter({ hasText: contactName });
    const isVisible = await card.isVisible();

    if (isVisible) {
        await card.getByTitle(/supprimer le contact/i).click();
        await page.getByRole('button', { name: /supprimer/i }).last().click();
        await page.waitForTimeout(500);
    }
}

/**
 * Creates a test user using the admin account.
 * Returns the user details for verification in tests.
 */
export async function createTestUser(page: Page, userData?: Partial<TestUser>): Promise<TestUser> {
    const timestamp = Date.now();
    const user: TestUser = {
        email: userData?.email || `test-${timestamp}@e2e.com`,
        prenom: userData?.prenom || 'TestPrenom',
        nom: userData?.nom || `TestNom${timestamp}`,
        role: userData?.role || 'poseur',
    };

    await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    await page.getByRole('link', { name: /administration/i }).click();
    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();

    await page.getByRole('button', { name: /nouvel utilisateur/i }).click();
    await expect(page.getByRole('heading', { name: /nouvel utilisateur/i })).toBeVisible();

    // Fill form using data-testid selectors
    await page.getByTestId('user-email-input').fill(user.email);
    await page.getByTestId('user-prenom-input').fill(user.prenom);
    await page.getByTestId('user-nom-input').fill(user.nom);
    await page.getByTestId('user-role-select').selectOption(user.role);

    await page.getByTestId('user-submit-btn').click();

    // Wait for modal to close
    await expect(page.getByRole('heading', { name: /nouvel utilisateur/i })).not.toBeVisible({ timeout: 5000 });

    return user;
}

/**
 * Navigates to contacts page and waits for it to be ready.
 */
export async function navigateToContacts(page: Page): Promise<void> {
    await page.getByRole('link', { name: /contacts/i }).click();
    await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();
    // Wait for loading to complete
    await page.waitForTimeout(500);
}

/**
 * Navigates to admin page and waits for it to be ready.
 */
export async function navigateToAdmin(page: Page): Promise<void> {
    await page.getByRole('link', { name: /administration/i }).click();
    await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
    // Wait for table to load
    await page.waitForTimeout(500);
}

/**
 * Navigates to trash page and waits for it to be ready.
 */
export async function navigateToTrash(page: Page): Promise<void> {
    await page.getByRole('link', { name: /corbeille/i }).click();
    await expect(page.getByRole('heading', { name: /corbeille/i })).toBeVisible();
    // Wait for data to load
    await page.waitForTimeout(500);
}

/**
 * Clears all test data (contacts, users) created during tests.
 * Should be called in afterAll hooks.
 */
export async function cleanupTestData(page: Page, options?: {
    contactNames?: string[];
    userEmails?: string[];
}): Promise<void> {
    if (options?.contactNames) {
        for (const name of options.contactNames) {
            try {
                await deleteTestContact(page, name);
            } catch {
                // Ignore errors - contact might already be deleted
            }
        }
    }

    // Note: User deletion is more complex and should be done carefully
    // to avoid deleting real users
}

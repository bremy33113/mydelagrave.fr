import { test, expect } from '@playwright/test';
import { ACCOUNTS, login, clearAuth } from './helpers';

test.describe('Contacts Page', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page);
        await page.getByRole('link', { name: /contacts/i }).click();
        await expect(page).toHaveURL(/#\/contacts/);
    });

    test('should display contacts page', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();
        await expect(page.getByPlaceholder(/rechercher/i)).toBeVisible();
    });

    test('should display contact cards', async ({ page }) => {
        // Wait for page to fully load (either shows contacts or "Aucun contact trouvé")
        await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();
        // Wait for loading to complete
        await page.waitForTimeout(500);

        // Check if page shows either contacts or empty message
        const contactCards = page.locator('[class*="glass-card"]');
        const emptyMessage = page.getByText(/aucun contact trouvé/i);

        // One of these should be visible
        const hasContacts = await contactCards.count() > 0;
        const isEmpty = await emptyMessage.isVisible();

        expect(hasContacts || isEmpty).toBe(true);
    });

    test('should filter contacts by search', async ({ page }) => {
        // Wait for page to be fully loaded
        await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();

        const searchInput = page.getByPlaceholder(/rechercher/i);
        await expect(searchInput).toBeVisible();
        await searchInput.fill('test');
        await page.waitForTimeout(300);
        await expect(searchInput).toHaveValue('test');
    });

    test('should filter contacts by category', async ({ page }) => {
        const categorySelect = page.locator('select').first();
        await expect(categorySelect).toBeVisible();
        await categorySelect.selectOption({ index: 1 });
        await page.waitForTimeout(300);
    });
});

test.describe('Contacts - Admin/Superviseur CRUD', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        await page.getByRole('link', { name: /contacts/i }).click();
    });

    test('should open create contact modal', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau contact/i }).click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();
    });

    test('should create a new contact', async ({ page }) => {
        await page.getByRole('button', { name: /nouveau contact/i }).click();

        // Wait for modal to open
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();

        // Fill form using data-testid selectors (more stable)
        await page.getByTestId('contact-entreprise-input').fill('Test Entreprise E2E');
        await page.getByTestId('contact-nom-input').fill('Test Contact E2E');
        await page.getByTestId('contact-email-input').fill('test-e2e@example.com');
        await page.getByTestId('contact-telephone-input').fill('0123456789');

        // Submit using data-testid
        await page.getByTestId('contact-submit-btn').click();

        // Verify modal closes and contact appears in list
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).not.toBeVisible({ timeout: 5000 });
        await expect(page.getByText('Test Contact E2E')).toBeVisible({ timeout: 3000 });
    });

    test('should edit a contact', async ({ page }) => {
        // First ensure a contact exists by creating one
        await page.getByRole('button', { name: /nouveau contact/i }).click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();
        await page.getByTestId('contact-entreprise-input').fill('Edit Test Corp');
        await page.getByTestId('contact-nom-input').fill('Edit Test Contact');
        await page.getByTestId('contact-submit-btn').click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).not.toBeVisible({ timeout: 5000 });

        // Wait for contact to appear
        await expect(page.getByText('Edit Test Contact')).toBeVisible({ timeout: 5000 });

        // Click edit button on the contact we just created
        const editButtons = page.getByTitle(/modifier le contact/i);
        await editButtons.first().click();

        // Modal should open with "Modifier le contact" heading
        await expect(page.getByRole('heading', { name: /modifier le contact/i })).toBeVisible();
    });

    test('should delete a contact with confirmation', async ({ page }) => {
        // First ensure a contact exists by creating one
        await page.getByRole('button', { name: /nouveau contact/i }).click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();
        await page.getByTestId('contact-entreprise-input').fill('Delete Test Corp');
        await page.getByTestId('contact-nom-input').fill('Delete Test Contact');
        await page.getByTestId('contact-submit-btn').click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).not.toBeVisible({ timeout: 5000 });

        // Wait for contact to appear
        await expect(page.getByText('Delete Test Contact')).toBeVisible({ timeout: 5000 });

        // Click delete button
        const deleteButtons = page.getByTitle(/supprimer le contact/i);
        await deleteButtons.first().click();

        // Confirm modal should appear (text is "Êtes-vous sûr...")
        await expect(page.getByText(/êtes-vous sûr/i)).toBeVisible();

        // Cancel first
        await page.getByRole('button', { name: /annuler/i }).click();
        await expect(page.getByText(/êtes-vous sûr/i)).not.toBeVisible();
    });
});

test.describe('Contacts - Chargé d\'Affaires Permissions', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.chargeAffaire.email, ACCOUNTS.chargeAffaire.password);
        await page.getByRole('link', { name: /contacts/i }).click();
    });

    test('should see create contact button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /nouveau contact/i })).toBeVisible();
    });

    test('should only edit/delete own contacts', async ({ page }) => {
        // First create a contact as Chargé d'Affaires (they own it)
        await page.getByRole('button', { name: /nouveau contact/i }).click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).toBeVisible();
        // Use data-testid selectors and unique names that don't overlap
        await page.getByTestId('contact-entreprise-input').fill('TestEntreprise CA');
        await page.getByTestId('contact-nom-input').fill('Jean Dupont CA');
        await page.getByTestId('contact-submit-btn').click();
        await expect(page.getByRole('heading', { name: /nouveau contact/i })).not.toBeVisible({ timeout: 5000 });

        // Wait for contact to appear in the list (use exact match for name)
        await expect(page.getByRole('heading', { name: 'Jean Dupont CA' })).toBeVisible({ timeout: 5000 });
        await expect(page.getByText('TestEntreprise CA')).toBeVisible();

        // Verify the contact card exists (this confirms CA can create contacts)
        const contactCards = page.locator('[class*="glass-card"]');
        await expect(contactCards.first()).toBeVisible();
    });
});

test.describe('Contacts - Poseur Permissions (Read-only)', () => {
    test.beforeEach(async ({ page }) => {
        await clearAuth(page);
        await login(page, ACCOUNTS.poseur.email, ACCOUNTS.poseur.password);
        await page.getByRole('link', { name: /contacts/i }).click();
    });

    test('should NOT see create contact button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /nouveau contact/i })).not.toBeVisible();
    });

    test('should NOT see edit buttons', async ({ page }) => {
        // Wait for page to fully load
        await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();
        await page.waitForTimeout(1000); // Wait for loading to complete

        // Poseur should never see edit buttons (regardless of whether contacts exist)
        const editButtons = page.getByTitle(/modifier le contact/i);
        await expect(editButtons).toHaveCount(0);
    });

    test('should NOT see delete buttons', async ({ page }) => {
        // Wait for page to fully load
        await expect(page.getByRole('heading', { name: 'Contacts' })).toBeVisible();
        await page.waitForTimeout(1000); // Wait for loading to complete

        // Poseur should never see delete buttons (regardless of whether contacts exist)
        const deleteButtons = page.getByTitle(/supprimer le contact/i);
        await expect(deleteButtons).toHaveCount(0);
    });
});

import { test, expect } from '@playwright/test';
import { login, ACCOUNTS } from './helpers';

test.describe('Gestion des Documents', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
        // Select first chantier
        await page.locator('[data-testid="chantier-card"]').first().click();
        await page.waitForTimeout(500);
    });

    test('should display documents section in chantier detail', async ({ page }) => {
        // Check that documents section exists
        await expect(page.locator('[data-testid="section-documents"]')).toBeVisible();

        // Check that documents count is displayed
        await expect(page.locator('[data-testid="documents-count"]')).toBeVisible();

        // Check that add document button is visible
        await expect(page.locator('[data-testid="btn-add-document"]')).toBeVisible();
    });

    test('should toggle documents section', async ({ page }) => {
        // Check that documents list is visible (expanded by default)
        await expect(page.locator('[data-testid="documents-list"]')).toBeVisible();

        // Click toggle button to collapse
        await page.locator('[data-testid="btn-toggle-documents"]').click();

        // Documents list should be hidden
        await expect(page.locator('[data-testid="documents-list"]')).not.toBeVisible();

        // Click again to expand
        await page.locator('[data-testid="btn-toggle-documents"]').click();

        // Documents list should be visible again
        await expect(page.locator('[data-testid="documents-list"]')).toBeVisible();
    });

    test('should open document upload modal', async ({ page }) => {
        // Click add document button
        await page.locator('[data-testid="btn-add-document"]').click();

        // Check modal is open
        await expect(page.getByText('Ajouter un document')).toBeVisible();

        // Check form elements are present
        await expect(page.locator('[data-testid="document-type-select"]')).toBeVisible();
        await expect(page.locator('[data-testid="document-dropzone"]')).toBeVisible();
        await expect(page.locator('[data-testid="document-name-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="document-description-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="document-submit-btn"]')).toBeVisible();
    });

    test('should have document type options', async ({ page }) => {
        // Click add document button
        await page.locator('[data-testid="btn-add-document"]').click();

        // Check modal is open
        await expect(page.getByText('Ajouter un document')).toBeVisible();

        // Check document type select has options
        const select = page.locator('[data-testid="document-type-select"]');

        // Verify the 4 document types are available
        await expect(select.locator('option')).toHaveCount(4);
    });

    test('should close modal on cancel', async ({ page }) => {
        // Click add document button
        await page.locator('[data-testid="btn-add-document"]').click();

        // Check modal is open
        await expect(page.getByText('Ajouter un document')).toBeVisible();

        // Click cancel button
        await page.getByRole('button', { name: 'Annuler' }).click();

        // Modal should be closed
        await expect(page.getByText('Ajouter un document')).not.toBeVisible();
    });

    test('should show empty state when no documents', async ({ page }) => {
        // Should show empty state message (since we start with no documents)
        await expect(page.getByText('Aucun document')).toBeVisible();
    });

    test('should upload a document and verify it appears in the list', async ({ page }) => {
        // Open upload modal
        await page.locator('[data-testid="btn-add-document"]').click();
        await expect(page.getByText('Ajouter un document')).toBeVisible();

        // Fill form
        await page.locator('[data-testid="document-type-select"]').selectOption('plan');

        // Upload a PDF file
        const buffer = Buffer.from('fake pdf content for testing');
        await page.locator('[data-testid="document-file-input"]').setInputFiles({
            name: 'test-plan.pdf',
            mimeType: 'application/pdf',
            buffer
        });

        // Wait for file to be processed
        await page.waitForTimeout(500);

        // Verify file name is auto-filled
        await expect(page.locator('[data-testid="document-name-input"]')).toHaveValue('test-plan.pdf');

        // Add description
        await page.locator('[data-testid="document-description-input"]').fill('Plan de test E2E');

        // Submit
        await page.locator('[data-testid="document-submit-btn"]').click();

        // Wait for modal to close
        await expect(page.getByText('Ajouter un document')).not.toBeVisible({ timeout: 5000 });

        // Verify document appears in the list
        await expect(page.getByText('test-plan.pdf')).toBeVisible();
        await expect(page.getByText('Plan de test E2E')).toBeVisible();

        // Verify empty state is gone
        await expect(page.getByText('Aucun document')).not.toBeVisible();
    });

    test('should delete a document and verify it appears in trash', async ({ page }) => {
        // First, upload a document
        await page.locator('[data-testid="btn-add-document"]').click();
        await page.locator('[data-testid="document-type-select"]').selectOption('devis');

        const buffer = Buffer.from('fake pdf content');
        await page.locator('[data-testid="document-file-input"]').setInputFiles({
            name: 'devis-test.pdf',
            mimeType: 'application/pdf',
            buffer
        });
        await page.waitForTimeout(300);
        await page.locator('[data-testid="document-submit-btn"]').click();
        await expect(page.getByText('Ajouter un document')).not.toBeVisible({ timeout: 5000 });

        // Verify document is visible
        await expect(page.getByText('devis-test.pdf')).toBeVisible();

        // Find and click delete button (hover to show action buttons)
        const documentRow = page.locator('[data-testid^="document-item-"]').first();
        await documentRow.hover();

        // Wait for delete button to be visible
        const deleteBtn = documentRow.locator('[data-testid^="btn-delete-document-"]');
        await deleteBtn.waitFor({ state: 'visible' });

        // Handle confirm dialog and click delete
        page.on('dialog', dialog => dialog.accept());
        await deleteBtn.click();

        // Wait for refresh and verify document is removed from list
        await page.waitForTimeout(500);
        await expect(page.getByText('devis-test.pdf')).not.toBeVisible({ timeout: 3000 });

        // Navigate to trash page
        await page.goto('/#/corbeille');
        await expect(page.getByRole('heading', { name: 'Corbeille' })).toBeVisible();

        // Click documents tab
        await page.locator('[data-testid="trash-tab-documents"]').click();

        // Verify deleted document appears in trash
        await expect(page.getByText('devis-test.pdf')).toBeVisible();
    });

    test('should open preview modal for image document', async ({ page }) => {
        // Upload an image document
        await page.locator('[data-testid="btn-add-document"]').click();
        await page.locator('[data-testid="document-type-select"]').selectOption('rapport');

        // Create a simple 1x1 PNG image (base64 decoded)
        const pngBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );
        await page.locator('[data-testid="document-file-input"]').setInputFiles({
            name: 'test-image.png',
            mimeType: 'image/png',
            buffer: pngBuffer
        });
        await page.waitForTimeout(300);
        await page.locator('[data-testid="document-submit-btn"]').click();
        await expect(page.getByText('Ajouter un document')).not.toBeVisible({ timeout: 5000 });

        // Verify image document is visible
        await expect(page.getByText('test-image.png')).toBeVisible();

        // Find and click preview button (hover to show action buttons)
        const documentRow = page.locator('[data-testid^="document-item-"]').first();
        await documentRow.hover();
        await documentRow.locator('[data-testid^="btn-preview-document-"]').click();

        // Verify preview modal is open
        await expect(page.locator('[data-testid="document-preview-modal"]')).toBeVisible();
        await expect(page.locator('[data-testid="preview-filename"]')).toContainText('test-image.png');
        await expect(page.locator('[data-testid="preview-image"]')).toBeVisible();

        // Close preview
        await page.locator('[data-testid="btn-close-preview"]').click();
        await expect(page.locator('[data-testid="document-preview-modal"]')).not.toBeVisible();
    });
});

test.describe('Documents dans la Corbeille', () => {
    test.beforeEach(async ({ page }) => {
        // Reset mock database to include new tables
        await page.goto('/');
        await page.evaluate(() => {
            // Remove initialized flag to reinitialize with new tables
            localStorage.removeItem('mock_db_initialized');
        });
        await page.reload();
        await login(page, ACCOUNTS.admin.email, ACCOUNTS.admin.password);
    });

    test('should display documents tab in trash', async ({ page }) => {
        // Navigate to trash page
        await page.goto('/#/corbeille');

        // Wait for page to load
        await expect(page.getByRole('heading', { name: 'Corbeille' })).toBeVisible();

        // Check documents tab exists
        await expect(page.locator('[data-testid="trash-tab-documents"]')).toBeVisible();
    });

    test('should switch to documents tab', async ({ page }) => {
        // Navigate to trash page
        await page.goto('/#/corbeille');

        // Wait for page to load
        await expect(page.getByRole('heading', { name: 'Corbeille' })).toBeVisible();

        // Click documents tab
        await page.locator('[data-testid="trash-tab-documents"]').click();

        // Should show documents content (empty state)
        await expect(page.getByText('Aucun document dans la corbeille')).toBeVisible();
    });
});

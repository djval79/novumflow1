import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Recruitment Flow', () => {
    test.beforeEach(async ({ page }) => {
        page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));
        page.on('request', request => {
            if (request.url().includes('supabase.co')) {
                console.log('SUPABASE REQUEST:', request.url());
            }
        });
    });

    test('Full Recruitment Lifecycle', async ({ page }) => {
        const timestamp = Date.now();
        const jobTitle = `E2E Test Job ${timestamp}`;
        const applicantFirstName = 'E2E';
        const applicantLastName = `Candidate ${timestamp}`;
        const applicantEmail = `e2e.candidate.${timestamp}@example.com`;

        // 1. Login via UI
        await page.goto('https://bgffggjfgcfnjgcj.vercel.app/login');
        await page.getByLabel('Email').fill('mrsonirie@gmail.com');
        await page.getByLabel('Password').fill('phoneBobby1?');
        await page.getByRole('button', { name: 'Sign in' }).click();

        // Wait for dashboard or redirection
        await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 15000 });

        // 2. Post a Job
        await page.goto('https://bgffggjfgcfnjgcj.vercel.app/recruitment');

        // Wait for button and click
        const newJobButton = page.getByRole('button', { name: 'New Job Posting' });
        await expect(newJobButton).toBeVisible();
        await newJobButton.click();

        // Wait for modal title (heading)
        await expect(page.getByRole('heading', { name: 'Create Job Posting' })).toBeVisible({ timeout: 10000 });

        // Wait for form field
        await expect(page.getByRole('heading', { name: 'Create Job Posting' })).toBeVisible();

        // Use locators based on labels since inputs don't have IDs
        await page.locator('div').filter({ hasText: /^Job Title \*$/ }).locator('input').fill(jobTitle);
        await page.locator('div').filter({ hasText: /^Department \*$/ }).locator('input').fill('Engineering');
        await page.locator('div').filter({ hasText: /^Location$/ }).locator('input').fill('Remote');
        await page.locator('div').filter({ hasText: /^Salary Range Min$/ }).locator('input').fill('50000');
        await page.locator('div').filter({ hasText: /^Salary Range Max$/ }).locator('input').fill('80000');

        // Set deadline to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const deadlineStr = tomorrow.toISOString().split('T')[0];
        await page.locator('div').filter({ hasText: /^Application Deadline$/ }).locator('input').fill(deadlineStr);

        await page.locator('div').filter({ hasText: /^Job Description \*$/ }).locator('textarea').fill('This is an automated test job posting.');
        await page.locator('div').filter({ hasText: /^Requirements \*$/ }).locator('textarea').fill('Playwright\nTypeScript\nAutomation');

        // Select status as Active (Published)
        await page.locator('div').filter({ hasText: 'Status' }).last().locator('select').selectOption('active');

        await page.getByRole('button', { name: 'Create Job Posting' }).click();

        // Verify job is listed
        await expect(page.getByText(jobTitle)).toBeVisible();

        // 2. Apply for the Job (Simulating via Admin "Add Application")
        await page.getByRole('button', { name: 'Applications' }).click();
        await page.getByRole('button', { name: 'Add Application' }).click();

        // Wait for application modal to be visible
        await expect(page.getByRole('heading', { name: 'Add New Application' })).toBeVisible({ timeout: 10000 });

        // Select the job we just created
        await page.locator('div').filter({ hasText: 'Job Posting' }).last().locator('select').selectOption({ label: new RegExp(jobTitle) });

        // Fill Application Form
        await page.locator('div').filter({ hasText: 'Position Applied For' }).last().locator('select').selectOption('Other');

        await page.locator('div').filter({ hasText: 'First Name' }).last().locator('input').fill(applicantFirstName);
        await page.locator('div').filter({ hasText: 'Last Name' }).last().locator('input').fill(applicantLastName);
        await page.locator('div').filter({ hasText: 'Email' }).last().locator('input').fill(applicantEmail);

        await page.getByRole('button', { name: 'Submit Application' }).click();

        // Verify application is listed
        await expect(page.getByText(`${applicantFirstName} ${applicantLastName}`)).toBeVisible();

        // 3. Interview Process (Move through stages)
        // Find the row with the applicant
        const row = page.getByRole('row', { name: `${applicantFirstName} ${applicantLastName}` });

        // Debug: Print row content
        const rowText = await row.textContent();
        console.log('ROW CONTENT:', rowText);

        if (await row.getByText('No workflow').isVisible()) {
            console.log('ERROR: Application has "No workflow"');
        }

        // Move to Screening
        await row.getByRole('combobox').selectOption({ label: 'Screening' });
        // Wait for update (optimistic UI might be fast, but let's wait a bit or verify)
        await page.waitForTimeout(1000);

        // Move to Interview
        await row.getByRole('combobox').selectOption({ label: 'Interview' });
        await page.waitForTimeout(1000);

        // Move to Offer
        await row.getByRole('combobox').selectOption({ label: 'Offer' });
        await page.waitForTimeout(1000);

        // Move to Hired
        await row.getByRole('combobox').selectOption({ label: 'Hired' });
        await page.waitForTimeout(1000);

        // Verify Hired status
        // The select should show 'Hired'
        await expect(row.getByRole('combobox')).toHaveValue(/[0-9a-f-]{36}/); // Value is UUID, but label should be Hired.
        // We can verify the selected option label
        const selectedOption = await row.getByRole('combobox').evaluate((sel: HTMLSelectElement) => sel.options[sel.selectedIndex].text);
        expect(selectedOption).toBe('Hired');
    });
});

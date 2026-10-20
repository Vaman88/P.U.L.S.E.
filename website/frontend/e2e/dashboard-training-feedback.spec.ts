import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })

test('dashboard shows training progress and celebrates only the new plan', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.route('**/src/browserForecast.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
    let plan = null;
    export const getBrowserPlan = () => plan;
    export const lockBrowserPlan = () => { plan = null };
    export const unlockBrowserPlan = async () => plan;
    export const trainInBrowser = async (_sales, _inventory, _years, onProgress) => {
      onProgress('Training medication models on this device');
      await new Promise(resolve => setTimeout(resolve, 700));
      plan = { model: 'browser_xgboost_direct_14d_v6', history_start: '2026-05-01', history_end: '2026-10-15', signal_years: 0,
        per_drug: [{ drug_name: 'Example', signals_used: [] }],
        items: [{ drug_name: 'Example', as_of_date: '2026-10-15', on_hand_units: 20, on_order_units: 0,
          forecast_1d_units: 1, forecast_7d_units: 7, forecast_14d_units: 14, minimum_buy_1d_units: 0,
          minimum_buy_7d_units: 0, minimum_buy_14d_units: 0, recommended_order_units: 0,
          days_until_stockout: null, inventory_status: 'covered' }] };
      return plan;
    };
  ` }))
  await page.route('**/src/privateStore.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export const privateStoreUnlocked = () => true;' }))
  await page.route('**/api/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify(
    route.request().url().includes('/auth/me') ? { username: 'preview' }
      : route.request().url().includes('/news/') ? { articles: [] } : { signals: [] },
  ) }))

  await page.goto('/dashboard')
  await expect(page.getByRole('heading', { name: 'Build your demand plan.' })).toBeVisible()
  await expect(page.locator('canvas')).toHaveCount(0)
  const files = page.locator('input[type="file"]')
  await files.nth(0).setInputFiles({ name: 'sales.csv', mimeType: 'text/csv', buffer: Buffer.from('date,drug_name,units_sold\n2026-10-15,Example,1') })
  await files.nth(1).setInputFiles({ name: 'inventory.csv', mimeType: 'text/csv', buffer: Buffer.from('date,drug_name,on_hand_units\n2026-10-15,Example,20') })
  await page.getByRole('button', { name: 'Train on this device' }).click()
  const progressbar = page.getByRole('progressbar', { name: 'Training on this device' })
  await expect(progressbar).toBeVisible()
  await expect(progressbar).not.toHaveAttribute('aria-valuenow', /.+/)
  await expect(progressbar).toHaveAttribute('aria-valuetext', /Training medication models on this device/)
  await expect(progressbar.locator('div').first()).toHaveCSS('background-image', /linear-gradient/)
  await expect(page.getByRole('heading', { name: 'Demand & inventory' })).toBeVisible()
  await expect(page.getByRole('progressbar', { name: 'Training on this device' })).toHaveCount(0)
  await expect(page.locator('canvas')).toHaveCount(1)
})

test('synthetic example opens without saving a trained plan', async ({ page }) => {
  await page.route('**/src/browserForecast.ts*', route => route.fulfill({ contentType: 'text/javascript', body: `
    export const getBrowserPlan = () => null;
    export const lockBrowserPlan = () => {};
    export const unlockBrowserPlan = async () => null;
    export const trainInBrowser = async () => { throw new Error('Training was not requested') };
  ` }))
  await page.route('**/src/privateStore.ts*', route => route.fulfill({ contentType: 'text/javascript', body: 'export const privateStoreUnlocked = () => true;' }))
  await page.route('**/api/**', route => route.fulfill({ json: { username: 'preview' } }))

  await page.goto('/dashboard')
  await page.getByRole('button', { name: 'View synthetic example' }).click()
  await expect(page.getByText('Illustrative synthetic example')).toBeVisible()
  await expect(page.getByText('Based on the 24-medication demo CSVs', { exact: false })).toBeVisible()
  await expect(page.getByText('Medications', { exact: true })).toBeVisible()
  await expect(page.getByText('24', { exact: true })).toBeVisible()
  await expect(page.getByText('Suggested orders to review')).toBeVisible()
  await expect(page.getByText('14', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent news & public signals' })).toHaveCount(0)
  await expect(page.locator('canvas')).toHaveCount(0)

  await page.getByRole('button', { name: 'Train with your files' }).click()
  await expect(page.getByRole('heading', { name: 'Build your demand plan.' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Build your demand plan.' })).toBeVisible()
})

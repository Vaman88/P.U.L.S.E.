import { expect, test } from '@playwright/test'

const prototypeUrl = new URL('../../prototype.html', import.meta.url).href
test.use({ channel: 'chrome' })

test('training shows progress, then celebrates the detailed plan', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    const result = {
      history_start: '2026-05-01', history_end: '2026-10-15', signal_years: 0,
      per_drug: [{ drug_name: 'Example', signals_used: [] }],
      items: [{ drug_name: 'Example', as_of_date: '2026-10-15', on_hand_units: 20,
        on_order_units: 0, forecast_1d_units: 1, forecast_7d_units: 7, forecast_14d_units: 14,
        minimum_buy_1d_units: 0, minimum_buy_7d_units: 0, minimum_buy_14d_units: 0,
        recommended_order_units: 0, days_until_stockout: null, inventory_status: 'covered',
        projected_stock_units: Array(15).fill(20) }],
    }
    ;(window as any).Worker = class {
      onmessage?: (event: { data: unknown }) => void
      postMessage(message: { type: string }) {
        if (message.type === 'prepare') window.setTimeout(() => this.onmessage?.({ data: { type: 'prepared', window: { start_date: '2026-10-15', end_date: '2026-10-15' } } }), 150)
        else (window as any).__finishTraining = () => this.onmessage?.({ data: { type: 'success', result } })
      }
      terminate() {}
    }
  })
  await page.goto(prototypeUrl)
  await page.locator('.nav [data-screen="workspace"]').click()
  await page.locator('#username').fill('preview')
  await page.locator('#password').fill('password123456')
  await page.locator('#access-submit').click()
  await page.locator('#sales-file').setInputFiles({ name: 'sales.csv', mimeType: 'text/csv', buffer: Buffer.from('date,drug_name,units_sold\n2026-10-15,Example,1') })
  await page.locator('#inventory-file').setInputFiles({ name: 'inventory.csv', mimeType: 'text/csv', buffer: Buffer.from('date,drug_name,on_hand_units\n2026-10-15,Example,20') })

  await page.locator('#train-device').click()
  await expect(page.locator('#train-progress')).toBeVisible({ timeout: 3000 })
  expect(await page.locator('#train-progress span').evaluate(element => getComputedStyle(element).animationName)).toBe('train-progress')
  await expect.poll(() => page.evaluate(() => typeof (window as any).__finishTraining)).toBe('function')
  await page.evaluate(() => (window as any).__finishTraining())
  await expect(page.locator('#plan')).toHaveClass(/active/)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
  await expect(page.locator('#train-progress')).toBeHidden()
  await expect.poll(() => page.locator('body > canvas').count()).toBeGreaterThan(0)
})

import { expect, test } from '@playwright/test'

declare let tourTime: number
declare function renderTour(): void

const prototypeUrl = new URL('../../prototype.html', import.meta.url).href
test.use({ channel: 'chrome' })

for (const width of [1440, 320]) {
  test(`walkthrough cursor and result stay in sync at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto(prototypeUrl)

    for (const [time, selector] of [
      [1900, '#tour-open-workspace'],
      [2700, '#tour-email'],
      [4200, '#tour-password'],
      [5350, '#tour-submit'],
      [6400, '#tour-sales-button'],
      [7350, '#tour-inventory-button'],
      [8400, '#tour-train-button'],
    ] as const) {
      const hit = await page.evaluate(({ time, selector }) => {
        tourTime = time
        renderTour()
        const cursor = document.querySelector('#tour-cursor')!.getBoundingClientRect()
        const control = document.querySelector(selector)!.getBoundingClientRect()
        return cursor.left + 2 >= control.left && cursor.left + 2 <= control.right && cursor.top + 2 >= control.top && cursor.top + 2 <= control.bottom
      }, { time, selector })
      expect(hit, `cursor should land on ${selector} at ${time}ms`).toBe(true)
    }

    const sequence = await page.evaluate(() => {
      const at = (time: number) => {
        tourTime = time
        renderTour()
        return {
          email: document.querySelector('#tour-email')!.textContent,
          password: document.querySelector('#tour-password')!.textContent,
          sales: document.querySelector('#tour-sales-name')!.textContent,
          inventory: document.querySelector('#tour-inventory-name')!.textContent,
        }
      }
      return { beforeEmail: at(2700), typingEmail: at(3500), signedUp: at(5400), beforeSales: at(6400), afterSales: at(6600), beforeInventory: at(7350), afterInventory: at(7550) }
    })
    expect(sequence.beforeEmail.email).toBe('')
    expect(sequence.typingEmail.email!.length).toBeGreaterThan(0)
    expect(sequence.typingEmail.email!.length).toBeLessThan('demo@pulse.example'.length)
    expect(sequence.signedUp.email).toBe('demo@pulse.example')
    expect(sequence.signedUp.password).toHaveLength(12)
    expect(sequence.beforeSales.sales).toBe('No file selected')
    expect(sequence.afterSales.sales).toContain('sample_sales.csv')
    expect(sequence.beforeInventory.inventory).toBe('No file selected')
    expect(sequence.afterInventory.inventory).toContain('sample_inventory.csv')

    await page.evaluate(() => {
      tourTime = 13600
      renderTour()
    })
    await expect(page.locator('#tour-stock-tooltip')).toHaveText('Day 9 · 0 units')
    await expect(page.locator('#tour-demand-number')).toHaveText('214')
    await expect(page.locator('#tour-order-number')).toHaveText('26')
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false)
  })
}

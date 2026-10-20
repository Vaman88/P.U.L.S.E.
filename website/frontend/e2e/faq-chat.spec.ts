import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })

for (const [name, url, list] of [
  ['site', '/', '.pulse-faq-list'],
  ['prototype', new URL('../../prototype.html', import.meta.url).href, '.faq-list'],
] as const) {
  test(`${name} FAQ smoothly switches answers without search`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(url)
    const faq = page.locator(list)
    const items = faq.locator('.faq-item')
    await expect(items.first().getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    await expect(faq.locator('form, input')).toHaveCount(0)
    await items.nth(1).getByRole('button').click()
    await expect(items.nth(1).getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    await expect(items.first().getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    await expect.poll(() => items.first().locator('.faq-panel').evaluate(element => element.getBoundingClientRect().height)).toBe(0)
    await expect.poll(() => items.nth(1).locator('.faq-panel').evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThan(0)
    await items.nth(1).getByRole('button').click()
    await expect(items.nth(1).getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    await expect.poll(() => items.nth(1).locator('.faq-panel').evaluate(element => element.getBoundingClientRect().height)).toBe(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })
}

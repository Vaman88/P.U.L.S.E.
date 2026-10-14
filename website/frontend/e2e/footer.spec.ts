import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })

test('public footer opens its privacy and use notices', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('.pulse-footer-wrap')
  await expect(footer.getByText('Contact', { exact: true })).toHaveCount(0)
  await footer.getByRole('link', { name: 'Privacy overview' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy overview' })).toBeVisible()
  await page.locator('.pulse-footer-wrap').getByRole('link', { name: 'Use & limitations' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Use & limitations' })).toBeVisible()
})

test('prototype footer uses the page background and opens legal screens', async ({ page }) => {
  await page.goto(new URL('../../prototype.html', import.meta.url).href)
  const footer = page.locator('.footer')
  expect(await footer.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(243, 248, 249)')
  await footer.getByRole('button', { name: 'Privacy overview' }).click()
  await expect(page.locator('#privacy')).toHaveClass(/active/)
  await footer.getByRole('button', { name: 'Use & limitations' }).click()
  await expect(page.locator('#terms')).toHaveClass(/active/)
  await footer.getByRole('button', { name: 'Questions' }).click()
  await expect(page.locator('#home')).toHaveClass(/active/)
})

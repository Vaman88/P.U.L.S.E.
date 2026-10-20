import { expect, test } from '@playwright/test'

test.use({ channel: 'chrome' })

test('website footer uses the page background and opens legal screens', async ({ page }) => {
  await page.goto('/')
  const footer = page.locator('.footer')
  await expect(page.locator('.nav-motion .brand img')).toHaveAttribute('src', '/public/pulse-supply-mark.svg')
  await expect(page.locator('.footer-wordmark img')).toHaveAttribute('src', '/public/pulse-supply-mark.svg')
  await page.locator('.footer-wordmark').hover()
  await expect(page.locator('.footer-wordmark span').first()).toHaveCSS('transform', /matrix\(1, 0, 0, 1, 0, -/)
  expect(await footer.evaluate(element => getComputedStyle(element).backgroundColor)).toBe('rgb(243, 248, 249)')
  await footer.getByRole('button', { name: 'Privacy overview' }).click()
  await expect(page.locator('#privacy')).toHaveClass(/active/)
  await footer.getByRole('button', { name: 'Use & limitations' }).click()
  await expect(page.locator('#terms')).toHaveClass(/active/)
  await footer.getByRole('button', { name: 'Questions' }).click()
  await expect(page.locator('#home')).toHaveClass(/active/)
})

import { expect, test } from '@playwright/test'

const prototypeUrl = new URL('../../prototype.html', import.meta.url).href
test.use({ channel: 'chrome' })

test('all six illustrations animate when scrolled into view', async ({ page }) => {
  await page.goto(prototypeUrl)
  const cards = page.locator('#home .editorial-grid .editorial-card')
  await expect(cards).toHaveCount(6)
  for (let index = 0; index < 6; index++) {
    await cards.nth(index).scrollIntoViewIfNeeded()
    await expect(cards.nth(index)).toHaveClass(/is-animated/)
  }
  await page.waitForTimeout(1700)
  const finished = await cards.evaluateAll(nodes => nodes.map((card, index) => {
    const shape = index === 3 ? card.querySelector('.card-art g rect') : index === 4 ? card.querySelector('.card-art g rect') : card.querySelector('.card-art svg > path:nth-of-type(2)')
    const style = getComputedStyle(shape!)
    return index === 3 ? style.opacity === '1' : index === 4 ? style.transform === 'matrix(1, 0, 0, 1, 0, 0)' : style.strokeDashoffset === '0px'
  }))
  expect(finished).toEqual([true, true, true, true, true, true])
  expect(await cards.first().locator('.card-art svg > path:nth-of-type(2)').evaluate(shape => getComputedStyle(shape).opacity)).toBe('0.18')
  expect(await cards.nth(3).locator('.card-art svg > rect:last-of-type').evaluate(shape => getComputedStyle(shape).opacity)).toBe('0.6')
})

test('a visible graph redraws, then stops cycling offscreen', async ({ page }) => {
  await page.goto(prototypeUrl)
  const shape = page.locator('#home .editorial-features .editorial-card:first-child .card-art svg > path:nth-of-type(2)')
  await shape.evaluate(element => {
    element.dataset.starts = '0'
    element.addEventListener('animationstart', () => { element.dataset.starts = String(Number(element.dataset.starts) + 1) })
  })
  await shape.scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await shape.getAttribute('data-starts')), { timeout: 7000 }).toBeGreaterThanOrEqual(2)
  await page.locator('#home .faq-section').scrollIntoViewIfNeeded()
  const starts = Number(await shape.getAttribute('data-starts'))
  await page.waitForTimeout(5000)
  expect(Number(await shape.getAttribute('data-starts'))).toBe(starts)
})

test('reduced motion leaves all six illustrations visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(prototypeUrl)
  const cards = page.locator('#home .editorial-grid .editorial-card')
  await expect(cards).toHaveCount(6)
  expect(await page.evaluate(() => document.documentElement.classList.contains('has-graph-motion'))).toBe(false)
  for (let index = 0; index < 6; index++) {
    const svg = cards.nth(index).locator('.card-art svg')
    await expect(svg).toBeVisible()
  }
})

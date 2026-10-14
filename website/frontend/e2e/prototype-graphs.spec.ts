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

test('line markers move continuously and pause offscreen', async ({ page }) => {
  await page.goto(prototypeUrl)
  await expect(page.locator('#home .graph-travel')).toHaveCount(4)
  const chart = page.locator('#home .editorial-features .editorial-card:first-child')
  await chart.scrollIntoViewIfNeeded()
  await expect(chart).toHaveClass(/is-in-view/)
  const svg = chart.locator('.card-art svg')
  const before = await svg.evaluate(element => element.getCurrentTime())
  await page.waitForTimeout(500)
  const after = await svg.evaluate(element => element.getCurrentTime())
  expect(after - before).toBeGreaterThan(.3)
  await page.locator('#home .faq-section').scrollIntoViewIfNeeded()
  await expect(chart).not.toHaveClass(/is-in-view/)
  expect(await svg.evaluate(element => element.animationsPaused())).toBe(true)
  const paused = await svg.evaluate(element => element.getCurrentTime())
  await page.waitForTimeout(500)
  expect(await svg.evaluate(element => element.getCurrentTime())).toBeCloseTo(paused, 1)
})

test('table cells and inventory bars keep highlighting in view', async ({ page }) => {
  await page.goto(prototypeUrl)
  for (const index of [0, 1]) {
    const card = page.locator('#home .editorial-workflow .editorial-card').nth(index)
    await card.scrollIntoViewIfNeeded()
    await expect(card).toHaveClass(/is-in-view/)
    const shape = card.locator('.card-art svg g rect').first()
    expect(await shape.evaluate(element => getComputedStyle(element).animationName)).toContain('graph-focus')
    expect(await shape.evaluate(element => getComputedStyle(element).animationIterationCount)).toContain('infinite')
  }
})

test('reduced motion leaves all six illustrations visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(prototypeUrl)
  const cards = page.locator('#home .editorial-grid .editorial-card')
  await expect(cards).toHaveCount(6)
  expect(await page.evaluate(() => document.documentElement.classList.contains('has-graph-motion'))).toBe(false)
  await expect(page.locator('#home .graph-travel')).toHaveCount(0)
  for (let index = 0; index < 6; index++) {
    const svg = cards.nth(index).locator('.card-art svg')
    await expect(svg).toBeVisible()
  }
})

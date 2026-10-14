import { test, expect } from '@playwright/test'
for (const width of [320,375,414,768,1440]) {
  test(`landing, demo and access fit ${width}px`, async ({page}) => {
    await page.setViewportSize({width,height:960})
    await page.emulateMedia({reducedMotion:'reduce'})
    await page.route('**/api/auth/me', route=>route.fulfill({status:401,json:{detail:'Unauthorized'}}))
    for (const path of ['/', '/demo', '/login', '/signup']) {
      await page.goto(path)
      await expect(page.getByRole('heading',{level:1})).toBeVisible()
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
      if(path==='/') {
        if(width===1440) {
          const title=(await page.locator('.pulse-hero-title').boundingBox())!
          const scene=(await page.locator('.pharmacy-scene').boundingBox())!
          const intro=(await page.locator('.compact-hero-intro').boundingBox())!
          expect(scene.x).toBeGreaterThan(title.x+title.width)
          expect(intro.y).toBeGreaterThanOrEqual(scene.y+scene.height)
        }
        await page.getByRole('button',{name:'Stock gap',exact:true}).click()
        await expect(page.locator('.stock-alert')).toHaveCSS('opacity','1')
        await page.getByRole('button',{name:'Delivery arrives',exact:true}).click()
        await expect(page.locator('.pharmacy-delivery')).toHaveCSS('opacity','1')
      }
    }
  })
}

test('landing uses source sections and the sample demo remains interactive',async({page})=>{
  await page.route('**/api/auth/me',route=>route.fulfill({status:401,json:{}}))
  await page.goto('/')
  await expect(page.getByRole('heading',{name:'Answers you can act on, without the noise.'})).toBeVisible()
  await expect(page.getByRole('heading',{name:'Two files in. A clearer plan out.'})).toBeVisible()
  await expect(page.locator('#questions').getByRole('heading',{name:'Questions'})).toBeVisible()
  await page.getByLabel('Find an answer').fill('What files do I need?')
  await page.getByRole('button',{name:'Find FAQ answer'}).click()
  await expect(page.locator('.pulse-faq-answer')).toContainText('A daily sales CSV')
  await expect(page.locator('.pulse-order-sheet,.pulse-mission-strip')).toHaveCount(0)
  await page.getByRole('link',{name:'Explore the demo',exact:true}).click()
  await expect(page.locator('.plan-table tbody tr')).toHaveCount(4)
  await page.getByRole('button',{name:'Needs attention',exact:true}).click()
  await expect(page.locator('.plan-table tbody tr')).toHaveCount(3)
})

test('demo stock marker can be dragged to inspect a day',async({page})=>{
  await page.goto('/demo')
  const chart=page.getByRole('slider',{name:'Projected stock day'})
  await expect(chart).toHaveAttribute('aria-valuenow','11')
  await chart.scrollIntoViewIfNeeded()
  const box=(await chart.boundingBox())!
  await page.mouse.move(box.x+box.width*(42+11/14*580)/650,box.y+box.height/2)
  await page.mouse.down()
  await page.mouse.move(box.x+box.width*(42+7/14*580)/650,box.y+box.height/2)
  await expect(chart).toHaveAttribute('aria-valuenow','7')
  await expect(page.getByText('Day 7 · 28 units')).toBeVisible()
  await page.mouse.up()
  await chart.focus()
  await page.keyboard.press('ArrowRight')
  await expect(chart).toHaveAttribute('aria-valuenow','8')
  await expect(page.getByText('Day 8 · 11 units')).toBeVisible()
})

test('access retains cookie-session login, local unlock and server logout',async({page})=>{
  let signedIn=false
  const requests:string[]=[]
  await page.route('**/api/**', async route=>{
    const path=new URL(route.request().url()).pathname
    requests.push(path)
    if(path==='/api/auth/session') { signedIn=true; return route.fulfill({json:{ok:true}}) }
    if(path==='/api/auth/logout') { signedIn=false; return route.fulfill({json:{ok:true}}) }
    if(path==='/api/auth/me') return route.fulfill({status:signedIn?200:401,json:signedIn?{username:'ui-test'}:{detail:'Unauthorized'}})
    return route.fulfill({json:{items:[],news:[],signals:[]}})
  })
  await page.goto('/login')
  const before=await page.locator('.pulse-header-inner').evaluate(el=>({height:el.getBoundingClientRect().height,radius:getComputedStyle(el).borderRadius}))
  await page.getByLabel('Username',{exact:true}).fill('ui-test')
  await page.getByLabel('Password',{exact:true}).fill('ui-test-password')
  await page.getByRole('button',{name:'Open my workspace',exact:true}).click()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByRole('navigation',{name:'Workspace navigation'})).toBeVisible()
  expect(await page.locator('.pulse-header-inner').evaluate(el=>({height:el.getBoundingClientRect().height,radius:getComputedStyle(el).borderRadius}))).toEqual(before)
  await page.getByRole('button',{name:'Logout',exact:true}).click()
  await expect(page).toHaveURL(/\/$/)
  expect(requests).toContain('/api/auth/session')
  expect(requests).toContain('/api/auth/logout')
  expect(requests).not.toContain('/api/auth/token')
})

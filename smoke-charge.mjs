import { chromium } from 'playwright'

const base = process.env.SMOKE_URL || 'http://localhost:4174'
const seedScript = (seed) => `(() => {
  let s = ${seed};
  Math.random = () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
})()`

async function playThrough(seed) {
  const errors = []
  const browser = await chromium.launch({ executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe' })
  const page = await browser.newPage({ viewport: { width: 400, height: 900 } })
  page.on('pageerror', (error) => errors.push(String(error)))
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.addInitScript(seedScript(seed))
  await page.goto(base, { waitUntil: 'networkidle' })
  const firstInput = page.locator('input').first()
  if ((await firstInput.count()) === 0) {
    console.log(`seed ${seed}: no onboarding input | body:`, (await page.locator('body').innerText()).slice(0, 200), '| errors:', errors)
    await browser.close()
    return { hasCharge: false, refuse: false }
  }
  await firstInput.fill('Khách sạn Biển Xanh')
  await page.getByRole('button', { name: /Mở khách sạn/ }).click()
  await page.waitForTimeout(700)

  const nav = (label) => page.locator('.main-nav button', { hasText: label }).first()
  await nav('Khách').click()
  await page.waitForTimeout(300)
  let accepted = false
  for (let i = 0; i < 20 && !accepted; i += 1) {
    const card = page.locator('.inbox-card').first()
    if (await card.count()) {
      await card.evaluate((el) => el.click())
      await page.waitForTimeout(150)
      const room = page.locator('.room-option').first()
      if (await room.count()) await room.evaluate((el) => el.click())
      await page.waitForTimeout(150)
      const send = page.getByRole('button', { name: /Gửi deal|Gửi giá|Đặt phòng|Đề nghị/i }).first()
      if (await send.count()) {
        await send.evaluate((el) => el.click())
        await page.waitForTimeout(300)
        const counter = page.getByRole('button', { name: /Chấp nhận|Đồng ý|giá mới/i }).first()
        if (await counter.count()) await counter.evaluate((el) => el.click())
        await page.waitForTimeout(300)
        accepted = (await page.locator('#offer-title').count()) === 0
      }
    }
    if (!accepted) {
      await page.locator('.hero-actions button', { hasText: 'Tua nhanh' }).click().catch(() => undefined)
      await page.waitForTimeout(350)
    }
  }

  const settle = async () => {
    await nav('Lưu trú').click()
    await page.waitForTimeout(200)
    const btn = page.locator('button', { hasText: 'Kết ca' }).first()
    if (await btn.count()) {
      await btn.evaluate((el) => el.click())
      await page.waitForTimeout(250)
      const confirm = page.getByRole('button', { name: 'Xác nhận kết ca' })
      if (await confirm.count()) await confirm.evaluate((el) => el.click())
    }
    await page.waitForTimeout(500)
  }

  console.log('accepted:', accepted)
  let charge = null
  for (let i = 0; i < 8; i += 1) {
    await settle()
    const staysText = await page.locator('.stay-list').innerText().catch(() => '')
    const row = page.locator('.stay-row', { hasText: 'Checkout' }).first()
    if (process.env.VERBOSE) console.log(`seed ${seed} settle#${i + 1} stays:`, staysText.replace(/\n+/g, ' | ').slice(0, 120))
    if (await row.count()) {
      await row.evaluate((el) => el.click())
      await page.waitForTimeout(350)
      charge = {
        hasCard: await page.locator('.charge-card').count() > 0,
        amount: (await page.locator('.charge-head strong').innerText().catch(() => '')) || null,
        note: (await page.locator('.charge-card p').innerText().catch(() => '')) || null,
        badge: (await page.locator('.charge-head span').innerText().catch(() => '')) || null,
        options: await page.locator('.charge-card .room-filter-chips button').allInnerTexts(),
        total: await page.locator('.confirm-summary').innerText().catch(() => ''),
      }
      break
    }
  }
  if (!charge) {
    console.log(`seed ${seed}: no waiting checkout found`)
    await browser.close()
    return
  }

  // pick the refuse branch when present, else collect
  const refuse = charge.options.some((o) => o.includes('Vẫn thu tiền'))
  const target = refuse ? 'Vẫn thu tiền' : charge.options[0]
  if (target) {
    await page.locator('.charge-card .room-filter-chips button', { hasText: target }).evaluate((el) => el.click())
  }
  const totalBefore = await page.locator('.confirm-summary').innerText()
  await page.getByRole('button', { name: /Xác nhận thu tiền/ }).evaluate((el) => el.click())
  await page.waitForTimeout(700)

  await nav('Tài chính').click()
  await page.waitForTimeout(500)
  const finance = await page.locator('.finance-layout').innerText()
  const receipt = await page.locator('.payment-row').first().innerText().catch(() => '')
  const settlement = await page.locator('.settlement-card').innerText().catch(() => '(chưa có)')

  console.log(`--- seed ${seed} ---`)
  console.log('charge card:', charge.hasCard, '| amount:', charge.amount, '| badge:', charge.badge)
  console.log('note:', charge.note)
  console.log('options:', charge.options.join(' / ') || '(không có phí)', '-> chose:', target)
  console.log('total before confirm:', totalBefore.replace(/\n+/g, ' '))
  console.log('take-home rows:', finance.split('\n').filter((l) => /Thực nhận/.test(l)).join(' || ') || '(thiếu)')
  console.log('receipt:', receipt.replace(/\n+/g, ' | '))
  console.log('settlement:', settlement.replace(/\n+/g, ' | '))
  console.log('errors:', errors)
  await browser.close()
  return { hasCharge: charge.hasCard, refuse, note: charge.note }
}

for (const seed of [7, 12345, 99, 2024, 31337, 555, 8080, 4242]) {
  await playThrough(seed)
}

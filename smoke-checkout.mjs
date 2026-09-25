import { chromium } from 'playwright'

const base = 'http://localhost:4173'
const errors = []
const browser = await chromium.launch({ executablePath: 'C:\\Users\\Lenovo\\AppData\\Local\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe' })
const page = await browser.newPage({ viewport: { width: 400, height: 860 } })
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})

await page.goto(base, { waitUntil: 'networkidle' })

// onboarding
const nameInput = page.locator('input[placeholder*="tên"]').first()
if (await nameInput.count()) {
  await nameInput.fill('Khách sạn Biển Xanh')
  await page.getByRole('button', { name: /Mở khách sạn/ }).click()
}
await page.waitForTimeout(600)

// go to guests tab
await page.getByRole('button', { name: /^Khách$/ }).click()
await page.waitForTimeout(400)

let accepted = false
for (let attempt = 0; attempt < 24 && !accepted; attempt += 1) {
  const guestRow = page.locator('.guest-card, .guest-row').first()
  if (await guestRow.count()) {
    await guestRow.click().catch(() => undefined)
    await page.waitForTimeout(200)
    const room = page.locator('.room-option, .room-tile, [role="button"]').first()
    if (await room.count()) {
      await room.click().catch(() => undefined)
    }
    await page.waitForTimeout(200)
    const send = page.getByRole('button', { name: /Gửi deal|Gửi giá|Xác nhận deal/i }).first()
    if (await send.count()) {
      await send.click().catch(() => undefined)
      await page.waitForTimeout(300)
      const counter = page.getByRole('button', { name: /Chấp nhận giá mới|Đồng ý giá mới/i }).first()
      if (await counter.count()) {
        await counter.click().catch(() => undefined)
        accepted = true
      }
      const gotIt = page.getByText(/đã nhận phòng|Đã chốt được giá/i).first()
      if (await gotIt.count()) accepted = true
    }
  }
  if (!accepted) {
    await page.getByRole('button', { name: /Tua nhanh/ }).click().catch(() => undefined)
    await page.waitForTimeout(250)
  }
}

console.log('accepted:', accepted)

// settle until waiting checkout appears
for (let i = 0; i < 8; i += 1) {
  await page.getByRole('button', { name: /^Lưu trú$/ }).click()
  await page.waitForTimeout(250)
  const settle = page.getByRole('button', { name: /Kết ca/ }).first()
  if (await settle.count()) {
    await settle.click()
    await page.waitForTimeout(200)
    const confirm = page.getByRole('button', { name: /Kết thúc ca|Xác nhận/i }).last()
    if (await confirm.count()) await confirm.click().catch(() => undefined)
  }
  await page.waitForTimeout(500)
  if (await page.getByText(/Chờ checkout/).count()) break
}

const waitingBefore = await page.getByText(/Chờ checkout/).count()
console.log('waiting badge:', waitingBefore)

// open checkout modal
const checkoutRow = page.locator('.stay-row').filter({ hasText: 'Checkout' }).first()
if (await checkoutRow.count()) {
  await checkoutRow.click()
  await page.waitForTimeout(300)
  const confirmPay = page.getByRole('button', { name: /Xác nhận thu tiền/ }).first()
  console.log('checkout modal:', await confirmPay.count())
  if (await confirmPay.count()) {
    await page.getByRole('button', { name: /Minibar/ }).click().catch(() => undefined)
    await confirmPay.click()
    await page.waitForTimeout(500)
  }
}

// finance tab
await page.getByRole('button', { name: /^Tài chính$/ }).click()
await page.waitForTimeout(400)
const financeText = await page.locator('.finance-layout').innerText().catch(() => 'n/a')
console.log('finance has collected:', financeText.includes('Đã thực thu tích lũy'))
console.log('finance has receipt:', financeText.includes('BIÊN NHẬN'))
console.log('finance text sample:', financeText.replace(/\n+/g, ' | ').slice(0, 600))

// stays tab should not show completed
await page.getByRole('button', { name: /^Lưu trú$/ }).click()
await page.waitForTimeout(300)
const staysText = await page.locator('.paper-panel').last().innerText().catch(() => '')
console.log('stays has completed filter:', staysText.includes('Đã checkout'))

// notice auto dismiss
await page.getByRole('button', { name: /^Hôm nay$/ }).click()
await page.waitForTimeout(200)

console.log('errors:', errors)
await browser.close()

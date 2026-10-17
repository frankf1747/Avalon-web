// Screenshots the demo harness into ../shots (JPEGs are made from these PNGs).
// Needs: demo server on :5180 (npx vite --config showcase/demo/vite.config.js) and puppeteer-core@23 installed.
import puppeteer from 'puppeteer-core'
const out = new URL('../shots', import.meta.url).pathname
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const page = await browser.newPage()
const shots = [
  ...['home', 'lobby', 'reveal', 'night', 'discuss', 'vote', 'mission', 'end'].map(s => [s, `screen=${s}`, 390, 844]),
  ['reveal-zh', 'screen=reveal&lang=zh', 390, 844],
  ['discuss-zh', 'screen=discuss&lang=zh', 390, 844],
  ['referee', 'screen=referee', 1180, 820],
]
for (const [name, q, width, height] of shots) {
  await page.setViewport({ width, height, deviceScaleFactor: 3 })
  await page.goto(`http://localhost:5180/?${q}`, { waitUntil: 'networkidle0' })
  await page.evaluate(() => document.fonts.ready)
  await new Promise(r => setTimeout(r, 2500)) // let flips and card animations settle
  await page.screenshot({ path: `${out}/${name}.png` })
  console.log(name)
}
await browser.close()

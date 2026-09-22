const { chromium } = require('playwright')

const cdpUrl = process.env.ADO_CDP_URL || 'http://127.0.0.1:9222'
const title = process.argv.slice(2).join(' ').trim() || 'Website'

async function main() {
  const browser = await chromium.connectOverCDP(cdpUrl)
  const contexts = browser.contexts()
  const pages = contexts.flatMap((context) => context.pages())
  const page = pages.find((candidate) =>
    candidate.url().includes('dev.azure.com') && candidate.url().includes('_backlogs')
  ) || pages.find((candidate) => candidate.url().includes('dev.azure.com'))

  if (!page) {
    throw new Error(`No Azure DevOps page found in ${cdpUrl}`)
  }

  await page.bringToFront()
  await page.waitForLoadState('domcontentloaded')

  console.log(`Backlog title: ${await page.title()}`)
  console.log(`Backlog url: ${page.url()}`)

  const existingDetail = page.locator('[role="dialog"]').first()
  if (await existingDetail.isVisible().catch(() => false)) {
    const existingText = await existingDetail.innerText()
    if (existingText.toLowerCase().includes(title.toLowerCase())) {
      console.log('Detail already open: true')
      console.log('--- Detail text excerpt ---')
      console.log(existingText.slice(0, 3000))
      return
    }

    await page.keyboard.press('Escape')
    await existingDetail.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {})
  }

  const exactTitle = page.getByText(title, { exact: true }).first()
  const titleCount = await page.getByText(title, { exact: true }).count()
  console.log(`Title candidate count for "${title}": ${titleCount}`)

  if (titleCount === 0) {
    throw new Error(`Could not find work item title: ${title}`)
  }

  await exactTitle.dblclick({ timeout: 10000 }).catch(async () => {
    await exactTitle.evaluate((element) => element.click())
  })

  const detail = page.locator('[role="dialog"]').first()
  await detail.waitFor({ state: 'visible', timeout: 15000 })

  const detailText = await detail.innerText()
  console.log('Detail opened: true')
  console.log('--- Detail text excerpt ---')
  console.log(detailText.slice(0, 3000))
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
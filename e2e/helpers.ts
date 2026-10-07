import { expect, type Page } from '@playwright/test'

/** Navigates and waits until React has hydrated, so clicks and typing are handled by the app. */
export async function visit(page: Page, path: string) {
  await page.goto(path)
  await page.locator('html[data-hydrated]').waitFor()
}

/** Signs in as the account created by scripts/seed.ts. */
export async function signInAsAsh(page: Page) {
  await visit(page, '/sign-in')
  await page.getByLabel('Email or username').fill('ash')
  await page.getByLabel('Password').fill('pallet-town-1')
  await page.getByRole('button', { name: 'Sign in', exact: true }).click()
  await page.waitForURL('/')
  // The header must pick up the new session without a reload.
  await expect(page.getByRole('button', { name: 'Account menu' })).toBeVisible()
}

/** Card art lives on a third-party CDN; keep e2e hermetic. */
export async function blockCardArt(page: Page) {
  await page.route('https://assets.tcgdex.net/**', (route) => route.abort())
}

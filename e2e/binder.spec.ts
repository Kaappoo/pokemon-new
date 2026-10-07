import { expect, test } from '@playwright/test'
import { blockCardArt, signInAsAsh, visit } from './helpers.ts'

test.beforeEach(({ page }) => blockCardArt(page))

test('search keeps Pokémon TCG Pocket out unless asked', async ({ page }) => {
  await visit(page, '/cards?q=charizard')
  await expect(page.getByText('2 cards')).toBeVisible()
  await expect(page.getByRole('link', { name: /Charizard ex.*Genetic Apex/ })).toHaveCount(0)

  await page.getByRole('switch').click()
  await expect(page.getByText('3 cards')).toBeVisible()
  await expect(page).toHaveURL(/pocket=true/)
})

test('a collector adds a card to the binder and the set shows progress', async ({ page }) => {
  await signInAsAsh(page)
  await visit(page, '/cards/sv03.5-133')
  await expect(page.getByRole('heading', { name: 'Eevee' })).toBeVisible()

  await page.getByRole('button', { name: 'Add a copy of Eevee' }).click()
  await expect(page.locator('output')).toHaveText('1')

  await visit(page, '/collection')
  await expect(page.getByRole('link', { name: /Eevee/ })).toBeVisible()

  await visit(page, '/sets/sv03.5')
  await expect(page.getByRole('progressbar', { name: 'Cards collected from this set' })).toHaveAttribute(
    'aria-valuenow',
    '4',
  )
})

test('the wishlist toggles from the card page', async ({ page }) => {
  await signInAsAsh(page)
  await visit(page, '/cards/base1-2')
  const toggle = page.getByRole('button', { name: 'Add to wishlist' })
  await toggle.click()
  await expect(page.getByRole('button', { name: 'On your wishlist' })).toHaveAttribute('aria-pressed', 'true')

  await visit(page, '/wishlist')
  await expect(page.getByRole('link', { name: /Blastoise/ })).toBeVisible()
})

test('anonymous visitors are sent to sign in and back', async ({ page }) => {
  await visit(page, '/collection')
  await expect(page).toHaveURL(/\/sign-in\?redirect=%2Fcollection/)
})

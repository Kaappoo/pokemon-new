import { http, HttpResponse } from 'msw'
import { TCGDEX_API } from '#/server/tcgdex/client.ts'

/**
 * Client tests must never reach the network: anything not handled here fails
 * the test (see `onUnhandledFrame` in tests/setup-client.ts). TCGdex answers
 * with a 404 so a component that accidentally calls it shows up immediately.
 */
export const handlers = [http.all(`${TCGDEX_API}/*`, () => HttpResponse.json({ error: 'not mocked' }, { status: 404 }))]

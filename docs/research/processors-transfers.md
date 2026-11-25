# Processors, data locations and LGPD international-transfer paperwork

Research for issue #9 — "Where do our processors handle data, and what international-transfer paperwork is needed?"
Researched 2026-11-25. Not legal advice; the controller has no lawyer, so every conclusion below is marked as either
**fact** (quoted from a primary source) or **reading** (our interpretation).

## TL;DR

- Every processor we use is a **US company whose own terms say processing happens primarily in the US**, whatever region
  we pick. Picking São Paulo regions cuts latency and the amount of data at rest abroad, but does not remove the
  international transfer.
- **None** of Vercel, Neon (Databricks), Resend or GitHub mentions Brazil, LGPD, the ANPD or the ANPD standard
  contractual clauses (SCCs) in its DPA. All their transfer machinery is EU SCC / UK / Swiss / EU-US DPF.
- The ANPD SCCs are only valid if adopted **in full and unaltered, in a contract signed by exporter and importer**
  (Res. 19/2024 Annex I art. 16). The deadline to put them into existing contracts was **23 August 2025** (12 months
  from publication) — already past.
- Realistic path for a one-person controller: (1) cut what reaches each processor (below), (2) ask each vendor in writing
  for the ANPD SCCs and keep the replies, (3) meanwhile rely on LGPD art. 33 IX (transfer necessary to perform the
  contract with the user, art. 7 V) for what is strictly needed to run the account, (4) publish the art. 17 §2
  transparency notice in Portuguese in a privacy policy (the app has none today).
- **TCGdex is not our processor** — it is an independent third party that the user's browser contacts directly. Disclose
  it, or proxy/self-host card art to stop sending visitors' IPs to it.

## What personal data exists in this app (from the code)

| Data | Where in code | Notes |
|---|---|---|
| Name, email, username, display username, bio, favourite card, avatar **URL** | `src/server/db/schema.ts` (`user`) | Avatar is any `https://` URL (`src/shared/schemas.ts` line 61), rendered on public profiles (`src/routes/u.$username.tsx`). |
| Password hash (scrypt; bcrypt for legacy accounts) | `account.password`, `src/server/password.ts` | Legacy Go tables `users`, `wishlists`, `collections` still hold a copy (ADR 0004). |
| Session token, **IP address, user agent**, expiry | `session` table (better-auth default) | |
| Magic-link / reset tokens keyed by email | `verification` table | |
| Wishlist and collection (card ids, quantities, timestamps) | `wishlist_items`, `collection_items` | |
| Recipient email + sign-in / reset URL containing a live token | `src/server/auth.ts` → `src/server/email/mailer.ts` → Resend | Only two emails exist: magic link and password reset (`templates.ts`). |
| Visitor IP, user agent, Referer (page URL) | Browser → `assets.tcgdex.net` | `src/routes/__root.tsx` preconnects to it; `src/sw.ts` caches its images (CacheFirst). No `referrerPolicy` set anywhere in `src/`. |
| `DATABASE_URL` (full-access Neon credentials) | `.github/workflows/sync-catalog.yml` | Nightly job runs `pnpm db:migrate` then `pnpm sync`. Sync writes only catalog tables, but the secret can read user tables. |

No analytics, error tracking or Vercel Analytics package is installed (`package.json`). There is no privacy-policy route
in `src/routes/`.

## Per processor

### Vercel (hosting, serverless functions, CDN, logs)

| Question | Finding | Source |
|---|---|---|
| Data touched | All request traffic (IPs, cookies incl. session cookie, form posts with emails/passwords), function runtime logs, env secrets (`DATABASE_URL`, `RESEND_API_KEY`, `BETTER_AUTH_SECRET`). | code |
| Function region | Default for new projects is `iad1` Washington D.C.; changeable in Settings → Functions or `vercel.json` `"regions"`. **Hobby = single region**, Pro = 5. `gru1` = AWS sa-east-1 São Paulo is a compute region. The repo has no `vercel.json`, so we are on whatever the dashboard says (likely `iad1`). | [Configuring regions](https://vercel.com/docs/functions/configuring-functions/region), [Regions list](https://vercel.com/docs/regions) (both last_updated 2026-08-11) |
| Where processing happens regardless | DPA §13.1: "Vercel's primary processing facilities are in the United States", and Vercel may process "anywhere else in the world where Vercel or its Subprocessors maintain data processing operations". Backups "globally replicated" (Sched. 2). | [Vercel DPA](https://vercel.com/legal/dpa), updated 2026-03-17 |
| DPA available? | **Only for Pro and Enterprise**: §1 says the Addendum applies to Processing "for Customers who are on Enterprise and Pro plans". Hobby has no DPA. | same |
| LGPD / ANPD SCCs | Not mentioned. Schedule 3 covers only 2021 EU SCCs and UK IDTA. Privacy policy (2026-06-01) has no Brazil section. | [DPA](https://vercel.com/legal/dpa), [Privacy policy](https://vercel.com/legal/privacy-policy) |

### Neon (Postgres) — now a Databricks product

| Question | Finding | Source |
|---|---|---|
| Data touched | Every table above, plus the legacy Go tables. | code |
| Regions | AWS us-east-1, us-east-2, us-west-2, eu-central-1, eu-west-2, ap-southeast-1, ap-southeast-2, **sa-east-1 (São Paulo)**. "You cannot change the region for an existing project" — a new project + data migration is needed. The repo does not record which region production uses. | [Neon regions](https://neon.com/docs/introduction/regions) |
| DPA | neon.com/dpa is a *Product Specific Schedule* (updated 2026-10-14) that ties self-service plans (incl. legacy plans) to the Databricks DPA, accepted "By accessing the Platform Services". Adds Grafana Labs (US) as subprocessor. | [Neon schedule](https://neon.com/dpa) |
| LGPD / ANPD SCCs | Databricks DPA: "Restricted Transfer" is defined only for data "subject to European Data Protection Laws"; SCC annex covers EU, UK, Swiss only; "Applicable Data Protection Laws" lists European law and CCPA. No Brazil. The DPA is a signable document ("By signing this DPA…"). Neon's compliance page doesn't mention LGPD; privacy contact is privacy@databricks.com. | [Databricks DPA PDF](https://www.databricks.com/legal/dpa) (file `DPA_OfflineStandard_ENG_v.3.0`), [Neon compliance](https://neon.com/docs/security/compliance) |

### Resend (transactional email)

| Question | Finding | Source |
|---|---|---|
| Data touched | Recipient email, subject, HTML/text body containing a live sign-in or reset URL; delivery logs. | code |
| Regions | Sending regions us-east-1, eu-west-1, **sa-east-1 São Paulo**, ap-northeast-1; chosen per domain, change = delete and re-add domain + new DNS. But: "All account data, including email metadata, logs, and API records" stay in the US regardless. The regions page states no plan restriction. | [Choosing a region](https://resend.com/docs/dashboard/domains/regions) |
| Where processing happens | DPA §6.1: "Company's primary processing operations take place in the United States". Privacy policy §7: "we transfer the data … to the United States and process it there." | [Resend DPA](https://resend.com/legal/dpa) (updated 2025-12-31), [Privacy policy](https://resend.com/legal/privacy-policy) (2026-08-27) |
| DPA / LGPD | DPA is incorporated into the ToS and binding on acceptance (§12). "Data Protection Laws" = CCPA, GDPR, Swiss FADP, UK DPA/PECR. Transfer mechanisms: EU SCCs + EU-US DPF/UK extension. No Brazil/ANPD. | same |

### GitHub (Actions: nightly catalog sync)

| Question | Finding | Source |
|---|---|---|
| Data touched | The runner holds `DATABASE_URL` with rights over all tables, and runs migrations. The sync itself reads TCGdex and writes `series`/`sets`/`cards` only — so GitHub *can* reach personal data, but the job does not read it. Repo contents contain no user data. | `.github/workflows/sync-catalog.yml`, ADR 0002 |
| Where | DPA §7.A: may transfer and process "to and in the United States" and "any other country in which GitHub or its Subprocessors operate". | [GitHub DPA](https://github.com/customer-terms/github-data-protection-agreement) (Version October 2025) |
| DPA applicability | Forms part of the GitHub Customer Agreement and covers "Online Services" provided "under a written and executed agreement"; it doesn't say whether a free personal account is covered. | same |
| LGPD / ANPD SCCs | Not mentioned; EU SCC, UK, Swiss, EU-US DPF only. General privacy statement (2026-04-27) has no Brazil section. | same, [Privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) |
| Reading | If the workflow used a Neon role limited to the catalog tables (and migrations ran only from Vercel's `vercel-build`, which already runs `scripts/migrate.ts`), GitHub would not handle personal data at all, so it would not be a processor for this app. | reading |

### TCGdex image host (`assets.tcgdex.net`)

| Question | Finding | Source |
|---|---|---|
| Data touched | Each card image request from a visitor's browser sends IP, user agent and (by default `strict-origin-when-cross-origin`) our origin as Referer. No cookies of ours. Service worker caches images 90 days, so repeats are fewer. | `src/sw.ts`, `src/routes/__root.tsx` |
| Where | `assets.tcgdex.net` resolves to 142.44.242.175, an OVH VPS (`vps-6c7997c4.vps.ovh.ca`), Beauharnois, Quebec, **Canada**; server `nginx`. DNS by ClouDNS. Checked 2026-11-25 via dns.google, ARIN RDAP and ipinfo. | live lookup |
| Policies | TCGdex privacy policy (effective 2024-07-15, controller "Florian Bouillon", privacy@tcgdex.net) covers only the website tcgdex.net: "We do not collect any personal information", analytics via plausible.io, data processed in the EU. It does **not** mention the API or the assets host, nor server logs. tcgdex.dev has no /privacy or /terms page (404). | [TCGdex privacy policy](https://www.tcgdex.net/privacy-policy) |
| Processor or third party? | **Third party, not a processor.** We give TCGdex no instructions, have no contract, and it does not process data on our behalf; the visitor's browser contacts it directly. Under Res. 19/2024 art. 6, direct collection by an agent abroad ("coleta internacional") is not a transfer by us. Our duty is transparency: tell users their browser loads images from TCGdex (Canada) and what that reveals (LGPD art. 9 and art. 18 VII on sharing). Or remove the flow by serving images from our own domain. | reading, based on [Res. 19/2024](https://bibliotecadigital.mj.gov.br/bitstream/1/13458/2/RES_ANPD_2024_19.pdf) art. 3, 6 |

Related, same category: **user-supplied avatar URLs** make every visitor of a public profile fetch an image from whatever
host the profile owner chose, disclosing visitors' IPs to arbitrary third parties. Worth restricting or proxying.

## The ANPD rules (primary text)

Source: [Resolução CD/ANPD nº 19, de 23 de agosto de 2024](https://bibliotecadigital.mj.gov.br/bitstream/1/13458/2/RES_ANPD_2024_19.pdf)
(DOU 23/08/2024), also on the [ANPD regulations page](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024).

- **Deadline** — Res. art. 2 sole para.: agents using contractual clauses for transfers "deverão incorporar as
  cláusulas-padrão contratuais aprovadas pela ANPD aos seus respectivos instrumentos contratuais, no prazo de até 12
  (doze) meses, contados da data de publicação" → **23 August 2025**.
- **What is a transfer** — Annex I art. 3: transfer = transmitting, sharing "ou disponibiliza acesso" to another agent;
  importer = agent "localizado em país estrangeiro". *Reading:* hosting in São Paulo by a US company that can access the
  data still means data is made available to a foreign importer; regional hosting reduces but does not clearly remove
  the transfer.
- **Two conditions** — Annex I art. 9: a legal basis (LGPD art. 7/11) **and** a mechanism: (a) ANPD adequacy decision,
  (b) SCCs / global corporate rules / specific clauses, or (c) LGPD art. 33 II "d" and III–IX. Limited to the minimum
  necessary (sole para.).
- **SCC validity** — art. 16: requires "adoção integral e sem alteração do texto disponibilizado no Anexo II, mediante
  instrumento contratual firmado entre o exportador e o importador"; may be a standalone contract or an addendum signed
  by both (§1); other terms cannot contradict them (§2). *Reading:* a vendor's click-through ToS cannot carry them unless
  the vendor itself publishes and accepts the unaltered Annex II text.
- **Transparency** — art. 17: give the full clauses to a data subject on request within 15 days; and publish on the
  website, in Portuguese and plain language, the form/duration/purpose of the transfer, destination country,
  controller identity and contact, shared use, responsibilities and security measures, and rights incl. petitioning the
  ANPD (§2); may live inside the privacy policy (§3).
- **Status of other mechanisms** — ANPD page: only the **European Union** is recognised as adequate (Resolução CD/ANPD
  nº 32, 26 Jan 2026); "nenhuma cláusula-padrão contratual equivalente foi reconhecida", and no specific clauses or global
  corporate rules approved. The US is not adequate.
  ([ANPD — Transferência internacional](https://www.gov.br/anpd/pt-br/assuntos/assuntos-internacionais/transferencia-internacional-de-dados/assuntos-internacionais-pt),
  [ANPD news on EU adequacy](https://www.gov.br/anpd/pt-br/assuntos/noticias/brasil-e-uniao-europeia-reconhecem-adequacao-mutua-em-protecao-de-dados-pessoais))
  EU adequacy only helps with an importer located in the EU; all four processors contract from US entities.
- **LGPD art. 33** ([Lei 13.709/2018](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)):
  besides SCCs, the relevant fallbacks are VIII (specific, highlighted consent with prior notice of the international
  character) and IX ("quando necessário para atender as hipóteses previstas nos incisos II, V e VI do art. 7º", i.e.
  incl. performance of a contract with the data subject). Art. 39: the operator processes per the controller's
  instructions.
- **Small agents** — [Res. CD/ANPD nº 2/2022](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022):
  natural persons and MEIs qualify unless high-risk processing; they get a simplified record of processing, no mandatory
  encarregado (but must keep a contact channel) and doubled deadlines. Art. 6: the rest of the LGPD still applies; the
  resolution does not mention or relax transfer rules. *Reading:* this app (no sensitive data, no children-targeted
  processing, not large scale) should qualify.

## What a one-person controller can realistically do

*Reading — not confirmed by the ANPD.* No vendor will sign bespoke contracts for a free-tier customer, and none
publishes ANPD clauses. The defensible position is: minimise, document, ask, disclose.

1. **Minimise what crosses the border**
   - Vercel: set Function region to `gru1` (Settings → Functions, or `vercel.json` `"regions": ["gru1"]`).
   - Neon: if production is not in `aws-sa-east-1`, create a project there and migrate (region is fixed per project).
   - Resend: re-add the sending domain in `sa-east-1` (metadata/logs still US).
   - GitHub: give the sync a Neon role with rights only on `series`/`sets`/`cards`; drop the `Apply migrations` step
     (Vercel's `vercel-build` already migrates). GitHub then touches no personal data.
   - TCGdex: proxy or copy card images onto our own domain; at least add `referrerPolicy="no-referrer"` on card images.
   - Restrict avatars to uploads or a proxy instead of arbitrary third-party URLs.
   - Drop the legacy Go tables (`users`, `wishlists`, `collections`) once confirmed healthy (ADR 0004) — fewer copies of
     password hashes.
   - Consider not storing `session.ipAddress`/`userAgent` if unused.
2. **Get the DPAs that exist**: Vercel requires **Pro** for any DPA (Hobby has none); Neon/Databricks DPA applies via the
   schedule and can be e-signed; Resend's applies on ToS acceptance; GitHub's free-account coverage is unclear. Save
   dated PDFs.
3. **Ask for ANPD SCCs in writing** (privacy@databricks.com, Vercel/Resend/GitHub privacy contacts), attaching Annex II.
   Keep the replies as evidence of diligence (Res. 19 art. 4 §2 requires measures able to demonstrate compliance).
4. **Pick and record the mechanism meanwhile**: art. 33 IX + art. 7 V (necessary to provide the account the user signed
   up for) for hosting, database and the sign-in/reset emails. Avoid art. 33 VIII consent as the main basis — it is
   revocable and must be specific and highlighted.
5. **Publish a privacy policy in Portuguese** with the art. 17 §2 items: processors, countries (US; Brazil/São Paulo for
   regional pieces; Canada for TCGdex if not proxied), purpose, controller contact channel, rights and the right to
   petition the ANPD.
6. **Keep a simplified record of processing** (Res. 2/2022 art. 9) listing the flows in the table above.

## Could not verify

- Vercel's subprocessor list with locations (security.vercel.com) — not fetched.
- Whether Databricks' DPA is actually offered to free-plan Neon users (schedule mentions self-service/legacy plans only).
- Whether GitHub's DPA covers free personal accounts.
- What the TCGdex assets host logs; its policy does not cover it.
- The production Neon project region and Vercel function region (not in the repo).

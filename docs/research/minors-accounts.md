# Accounts for 12–17 year olds: what LGPD and the ECA Digital require

Research for issue #7, written on **2026-11-25**. This is not legal advice. Nobody with legal training has reviewed it. It sets out what the primary texts say, keeps that apart from interpretation, and takes the conservative reading wherever the text is unclear.

**Context (owner's decision):** teenagers aged 12–17 may hold accounts; under-12s are not a target; anyone can browse without an account; profiles will become private by default. The operator is a Brazilian individual using their own CNPJ. The app is live but has no real users yet.

Labels used below: **[Text]** means what a source says, quoted or closely paraphrased. **[Interp.]** means my reading of it. **[Conservative]** means the safe choice where the text is ambiguous.

---

## 1. Sources

| Short name | What it is | Where read |
|---|---|---|
| **LGPD** | Lei 13.709/2018 | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm (read with WebFetch, which garbled the accents) |
| **ECA Digital** | Lei 15.211/2025, consolidated text including Lei 15.352/2026 and Lei 15.504/2026 | Câmara consolidated PDF https://www2.camara.leg.br/legin/fed/lei/2025/lei-15211-17-setembro-2025-797997-normaatualizada-pl.pdf (read in full). Arts. 7, 24 and 41-A cross-checked against Planalto https://www.planalto.gov.br/ccivil_03/_Ato2023-2026/2025/Lei/L15211.htm |
| **Decreto 12.880** | Decreto 12.880 of 18 Mar 2026, which regulates the ECA Digital | DOU extra edition of 18 Mar 2026, as republished by the MJ: https://www.gov.br/mj/pt-br/assuntos/arquivos-imprensa/sedigi/decretos-eca-digital.pdf (read in full). Planalto copy: https://www.planalto.gov.br/ccivil_03/_Ato2023-2026/2026/decreto/D12880.htm |
| **Enunciado 1/2023** | Enunciado CD/ANPD nº 1 of 22 May 2023 | MJ digital library (SEI copy): https://bibliotecadigital.mj.gov.br/bitstream/1/10215/2/Enunciado_ANPD_2023_1.html |
| **ANPD Guia Fornecedores** | ANPD guide "Fornecedores de produtos ou serviços de TI: escopo e obrigações gerais do ECA Digital", v1.0, October 2026 | https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-fornecedores-de-produtos-ou-servicos-de-tecnologia-da-informacao.pdf |
| **ANPD Orientações preliminares** | "Mecanismos confiáveis de aferição de idade – orientações preliminares", March 2026 | https://www.gov.br/anpd/pt-br/assuntos/eca-digital/mecanismos-confiaveis-de-afericao-de-idade-orientacoes-preliminares.pdf |
| **ANPD draft age guide** | Draft guide "Mecanismos de Aferição de Idade" put out for consultation (tomada de subsídios), May 2026, SEI 00261.003182/2026-47. **Not final.** | Linked from https://www.gov.br/anpd/pt-br/assuntos/eca-digital (Brasil Participativo PDF) |
| **ANPD FAQ** | "Perguntas e respostas sobre o ECA Digital" (ANPD/MJSP/Secom), updated 30 Jul 2026 | https://www.gov.br/anpd/pt-br/assuntos/eca-digital/perguntas_respostas_eca_digital_30072026.pdf |
| **ANPD ECA page** | ANPD hub page for the ECA Digital, with its timeline | https://www.gov.br/anpd/pt-br/assuntos/eca-digital |
| **Res. 2/2022** | Resolução CD/ANPD nº 2/2022 (small processing agents) | DOU copy hosted on gov.br: https://www.gov.br/palmares/pt-br/midias/arquivos-menu-acesso-a-informacao/legislacao/resolucao-cd-anpd-n2-2022.pdf. **This is the January 2022 text; I did not check for later amendments.** |
| **ECA** | Lei 8.069/1990 | https://www.planalto.gov.br/ccivil_03/leis/l8069.htm |
| **Código Civil** | Lei 10.406/2002 | https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm |

**Gaps in what I could read:**
- Fetching planalto.gov.br through `curl` returned an empty reply. I read Planalto pages only through WebFetch, which garbles accents and caps quotations, so I used the Câmara and DOU copies as the full texts.
- The ANPD "Radar Tecnológico nº 5" PDF did not download (the connection was reset). I did not read it.
- I found **no** final ANPD resolution on age assurance, parental-supervision standards, or ECA Digital sanctions/dosimetry. The ANPD ECA page lists the age guide as still being updated after the consultation. Its timeline promised updated enforcement regulations "from November 2026", and I could not confirm whether they have been published. Section 7 has more.

---

## 2. Who counts as a child or an adolescent

- **[Text]** A child is a person up to 12 years incomplete; an adolescent is aged 12 to 18 (ECA art. 2). The ECA Digital adopts these definitions (ECA Digital art. 2 §1).
- **[Text]** People under 16 are absolutely incapable of performing acts of civil life themselves. People aged 16–17 are relatively incapable (Código Civil arts. 3 and 4, I). An act by an absolutely incapable person is void (art. 166, I). An act by a relatively incapable person is voidable (art. 171, I).
- **[Interp.]** Accepting the Terms of Use is a contract. A 12–15 year old cannot validly accept it alone; a parent has to represent them. A 16–17 year old needs a parent's assistance. This is general civil law, not data-protection law, but it points the same way as ECA Digital art. 24 (section 4.3).

---

## 3. LGPD art. 14: adolescents versus children

### What the text says
- **[Text]** Art. 14 caput: processing of children's **and adolescents'** data "deverá ser realizado em seu melhor interesse".
- **[Text]** §1: processing of **children's** data requires "consentimento específico e em destaque dado por pelo menos um dos pais ou pelo responsável legal". §5: the controller must make "todos os esforços razoáveis" to verify that consent came from the guardian.
- **[Text]** §2: for the processing in §1, controllers must publish the types of data collected, how they are used and how to exercise art. 18 rights.
- **[Text]** §3: children's data may be collected without consent only to contact the parents (used once and not stored) or for the child's protection, and never passed to third parties.
- **[Text]** §4: the controller may not make participation in "jogos, aplicações de internet ou outras atividades" conditional on more personal data than strictly necessary. The cross-reference is to the "titulares de que trata o § 1º", which means children.
- **[Text]** §6: information must be "simples, clara e acessível", adapted to the user, and "adequada ao entendimento da criança".

### The ANPD's reading
- **[Text]** Enunciado CD/ANPD nº 1/2023: "O tratamento de dados pessoais de crianças e adolescentes poderá ser realizado com base nas hipóteses legais previstas no art. 7º ou no art. 11 da LGPD, desde que observado e prevalecente o seu melhor interesse, a ser avaliado no caso concreto, nos termos do art. 14 da Lei."
- **[Interp.]** For **adolescents**, the LGPD requires no parental consent. Any art. 7 legal basis works (for an account, performance of contract under art. 7, V), provided the best-interest test is met and documented for each processing purpose. Parental consent under §1 is a **children-only** rule, and under-12s are excluded here anyway.
- **[Conservative]** Apply §4 (data minimisation as a condition of participation) and §6 (age-appropriate notices) to teenagers too. ECA Digital art. 16 already points back to LGPD art. 14 for the information duties to "pais, responsáveis legais, crianças e adolescentes", and art. 7 §1 requires information that adolescents can understand.
- I found no final ANPD guide specifically on children's data. A consultation on that topic opened in June 2024; I saw no outcome.

---

## 4. ECA Digital (Lei 15.211/2025)

### 4.1 Effective date and regulator
- **[Text]** In force since **17 March 2026** (art. 41-A, added by Lei 15.352/2026; an earlier MP 1.319/2025 version said six months after publication).
- **[Text]** The ANPD regulates and enforces it (Decreto 12.880 art. 1 sole paragraph). The ANPD issues warnings and fines; suspension and prohibition of activities are for the courts (ECA Digital art. 35 §5).
- **[Text]** Sanctions (art. 35): a warning with up to 30 days to correct; a fine of up to 10% of the economic group's Brazilian revenue, or, **where there is no revenue, R$10 to R$1,000 per registered user**, capped at R$50 million per infraction; suspension; prohibition. Gradation weighs gravity, repeat offending, economic capacity and the provider's social purpose (§1).
- **[Text]** ANPD timeline: an adaptation and monitoring period for age assurance from August to November 2026; updated regulations from November 2026; enforcement focused on age assurance from January 2027 (ANPD ECA page).

### 4.2 Does it cover this app? ("acesso provável")
- **[Text]** Art. 1 covers every IT product or service "direcionado a crianças e a adolescentes … ou de acesso provável por eles". The sole paragraph lists the conditions: I, "suficiente probabilidade de uso e atratividade"; II, "considerável facilidade ao acesso e utilização"; III, "significativo grau de risco à privacidade, à segurança ou ao desenvolvimento biopsicossocial", "especialmente" for services that allow social interaction and large-scale sharing.
- **[Text]** The ANPD Guia Fornecedores (pp. 28–41) says:
  - All three conditions are **cumulative**. However, this reading "não pode ser utilizada para restringir injustificadamente" the law's reach, and it must follow the best-interest principle.
  - A provider's own assessment does not bind the ANPD.
  - Measures taken to comply with the law, including age assurance, **cannot be used to argue that a condition is missing**. The guide calls that argument circular.
  - Signs that a service is in scope include content of interest to children, attractive design, similarity to presumed services, and actual use by minors.
  - On attractiveness: "tematização, personagens, recompensas, gamificação … ainda que não acompanhados de linguagem ou estética visual explicitamente infantis".
  - "Direcionado" means the provider explicitly declares the product is aimed at children or teens, for example in its terms.
- **[Interp.]**
  - **Condition I** is clearly met: Pokémon characters, collecting and completion progress.
  - **Condition II** is met: free, works in any browser, email sign-up. The guide's "Tamara" example treats a simple email sign-up as ease of access.
  - **Condition III** is the arguable one. The app has no messaging, feed or follows. But it has had public profiles with a free-text bio, a display name, an avatar URL and shareable OG images, and it holds account data of minors. Under the guide, making profiles private to comply cannot be counted to escape condition III.
  - Separately, the owner's decision to **admit** 12–17 year olds, if stated in the terms, comes close to the guide's description of a "direcionado" service.
- **[Conservative]** Treat the whole app as **in scope**, including the anonymous browsing part. In-scope duties include protective defaults, no ad profiling, no compulsive or manipulative design, a reporting channel and a published risk assessment.

### 4.3 Art. 24: linking accounts of under-16s to a guardian (the biggest design question)
- **[Text]** Art. 24 caput: "os provedores de produtos ou serviços direcionados a crianças e a adolescentes ou de acesso provável por eles deverão garantir que usuários ou contas de crianças e de adolescentes de até 16 (dezesseis) anos de idade estejam vinculados ao usuário ou à conta de um de seus responsáveis legais." (Cross-checked against Planalto.)
- **[Text]** §5: "Na ausência de usuário ou conta dos responsáveis legais, os provedores deverão vedar a possibilidade de alteração das configurações de supervisão parental da conta para um nível menor de proteção em relação ao padrão estabelecido nos arts. 3º e 7º".
- **[Text]** The article sits in Chapter IX, "Das redes sociais". The ANPD Guia Fornecedores (p. 14) and the ANPD FAQ both present account linking as a **social-network** obligation. The FAQ says: "Para usar redes sociais, crianças e adolescentes menores de 16 anos deverão ter contas vinculadas aos seus responsáveis".
- **[Text]** Definition of rede social (art. 2, III): an application whose "principal finalidade" is users sharing and spreading opinions and information through connected accounts, "permitida a conexão entre usuários". The guide (pp. 14–16) says this depends on the predominant purpose. A school platform whose student forum is only incidental is **not** a social network.
- **[Interp.]** Poké Cards' main purpose is a catalogue plus personal collection tracking. There are no connections between users. It is very probably **not** a social network. Once profiles are private, the case is stronger still.
- **Ambiguity:** the caput of art. 24 names every in-scope provider, not only social networks. The heading and the ANPD's material read it as a social-network rule. "Até 16 anos" is also unclear: it could mean under 16, or up to and including 16. The FAQ says "menores de 16".
- **[Conservative]** One of:
  - (a) Require 12–15 year olds to have an account linked to a guardian, with the guardian accepting the terms. This also settles the civil-capacity problem in section 2. Under §5, an unlinked account could never be set below the default protection.
  - (b) Admit only 16–17 year olds independently for now, and open 12–15 later together with guardian linking.

  Deciding to rely on the "not a social network" reading without linking is a judgement call for the owner, and it should be written down in an ADR.

### 4.4 Privacy by default
- **[Text]** Art. 7: from conception, providers must "garantir, por padrão, a configuração no modelo mais protetivo disponível em relação à privacidade e à proteção de dados pessoais". §1 says the service must run at the highest level of privacy by default, with clear information so that the child or adolescent **and their guardians** can make informed choices about any less protective setting. §2 forbids processing that causes, facilitates or contributes to violating their privacy.
- **[Text]** Decreto 12.880 art. 10 sole paragraph treats as manipulative any design that hides, fragments or makes hard to reach privacy controls, parental supervision, consent or revocation (III), or that uses emotional pressure or "urgências fabricadas" (II).
- **[Interp.]** Private profiles by default meets art. 7. Any opt-in to public must be clear, symmetrical, reversible and not nudged. Under art. 24 §5, under-16s without a linked guardian **could not** opt in at all.

### 4.5 Age assurance: is a self-declared birthdate enough?
- **[Text]**
  - Art. 9 §1 bans self-declaration ("vedada a autodeclaração"), but only for content or services that are improper or prohibited for under-18s.
  - Art. 10: in-scope providers "deverão adotar mecanismos para proporcionar experiências adequadas à idade".
  - Art. 14 caput: they must be able to **receive** age signals from app stores and operating systems.
  - Art. 14 sole paragraph: they must have their own mechanisms against inappropriate content.
- **[Text]** Decreto 12.880:
  - Art. 2, VII defines autodeclaração as "sem evidências adicionais".
  - Art. 24 sets principles: proportionality to risk, accuracy, data minimisation, no reuse of age data (also ECA Digital art. 13), no traceability.
  - Art. 24 §3: document images must be deleted "de modo imediato e irreversível".
  - Art. 27: users must be able to contest an assessed age.
  - Art. 26 §2 (web services "deverão aferir a idade") applies under its caput to providers of improper, inappropriate or prohibited content.
- **[Text]** ANPD Orientações preliminares (p. 11): solutions "baseadas exclusivamente em autodeclaração … possuem baixo grau de confiabilidade".
- **[Text]** ANPD draft age guide (May 2026, **not final**):
  - Self-declaration "não constitui um mecanismo confiável … não pode ser utilizada em contextos de maior risco". Typing in a CPF counts as self-declaration.
  - Its risk matrix puts services "que permitam interação entre usuários; que permitam compartilhamento de conteúdo" at **moderate** risk (examples: social networks, games with interaction). Educational and cultural platforms and all-ages games are **low** risk.
  - For low risk it suggests the minimum-impact method, giving as examples receiving OS or store age signals and verifiable credentials. It recommends layered escalation and a RIPD (data protection impact report).
- **[Interp.]**
  - No provision **forbids** a self-declared birthdate for a service like this. The explicit ban covers adult or prohibited content.
  - But the ANPD has said in writing that self-declaration on its own is not a *reliable* mechanism. Self-declaration does not appear even in the draft's low-risk examples.
  - With private profiles and no interaction, the app arguably fits "low risk". With public profiles and a free-text bio, it edges toward "moderate".
- **[Conservative]**
  - Use a self-declared date of birth as the **first layer only**.
  - Accept OS or browser age signals once they exist.
  - Escalate to a stronger check where there are signs of under-12 use or an unlinked under-16.
  - Store only the derived age band, never document images.
  - Allow contestation (Decreto 12.880 art. 27).
  - Record the proportionality reasoning in the art. 47 risk assessment.
  - Revisit when the final ANPD age guide comes out. Enforcement focused on age assurance starts January 2027.

### 4.6 Profiling and advertising
- **[Text]** Art. 22 bans profiling to target commercial advertising at children and adolescents, as well as emotional analysis and AR/VR for that purpose. Art. 26 bans building behavioural profiles of minors for ad targeting, including from age-assurance data and group data. Decreto 12.880 art. 33 repeats this. Art. 6, V asks providers to prevent "práticas publicitárias predatórias".
- **[Interp.]** The app has no ads and no analytics today (no analytics SDK found in `src/`). Keep it that way for minors' accounts. Any future ads or affiliate links must be contextual only.

### 4.7 Parental supervision tools
- **[Text]** Art. 17 requires: accessible, easy supervision settings (I); information for parents about them (II); a visible notice when supervision is active (III); tools to limit and monitor usage time (IV). §4 sets defaults at the highest protection, including restricting communication with unauthorised users, limiting autoplay, rewards and notifications, and controlling recommendation systems.
- **[Text]** Art. 18 says the tools must let parents view and manage the account and privacy options (I), restrict purchases (II), see adult profiles the minor talks to (III), see total usage time (IV), switch safeguards on and off (V), and use Portuguese (VI).
- **[Text]** Art. 39 says the obligations in arts. 6, 17, 18, 19, 20, 27, 28, 29, 31, 32 and 40 are **modulated** by the service's features, the provider's control over content, the number of users and the provider's size. §3 leaves objective criteria to regulation (ANPD, under Decreto 12.880's list of ANPD powers). ANPD standards for parental supervision (art. 17 §1) have **not** been published.
- **[Interp.]** Many art. 18 items have nothing to apply to here: no purchases, no communication. Art. 39 lets a tiny provider scale the rest down. A guardian-linked account, if adopted (section 4.3), naturally carries the core tools: viewing and managing privacy settings, viewing activity, and deleting the account.
- **[Conservative]** Publish a short guardians' page (art. 17 II, art. 16). Avoid streaks and engagement notifications (art. 8 IV; Decreto 12.880 art. 9: "recompensas pelo tempo de uso", "notificações excessivas").

### 4.8 Other duties that apply whatever the provider's size
- **Information (art. 16):** information about risks and safety measures, available without signing up. If processing goes beyond what is strictly necessary, map the risks and prepare an impact report on request (sole paragraph).
- **Risk management (art. 8 I) and impact assessment (Decreto 12.880 art. 47):** all in-scope providers must do one and publish a plain-language summary (§1). ANPD rules on content and frequency are still pending (§2).
- **Age rating (art. 8 V; Decreto 12.880 art. 12 §4):** tell users the recommended age band, and state the age rating in the terms of use.
- **Reporting channel (art. 28; Decreto 12.880 art. 41):** accessible, free and widely advertised.
- **Takedown without a court order (art. 29):** applies when notified by the victim, their representatives, the Ministério Público or accredited organisations. Includes a contest/appeal procedure (art. 30) and safeguards against abusive reports (arts. 32–33).
- **Serious violations (art. 27; Decreto 12.880 arts. 36–39):** remove and report apparent sexual exploitation, abuse or grooming to the Polícia Federal's Centro Nacional de Triagem, and preserve the data.
- **Not applicable here:**
  - Semi-annual transparency reports only above 1 million minor users (art. 31).
  - The local legal representative (art. 40) is aimed at foreign companies.
  - Loot boxes (art. 20) and in-game interaction (art. 21) are not relevant.

---

## 5. Credibly excluding under-12s

- **[Text]** Nothing in the LGPD or the ECA Digital requires a minimum age. Admitting under-12s would bring in LGPD art. 14 §1 parental consent with "esforços razoáveis" to verify it (§5).
- **[Text]** A provider cannot declare its way out of scope. The guide says "acesso provável" "não pode ser afastada por formalismos ou por tentativas de ignorar situações reais", and the provider's self-assessment does not bind the ANPD (Guia Fornecedores pp. 31–32).
- **[Text]** LGPD art. 14 §3 allows collecting a child's data without consent only to contact the parents (once, not stored) or to protect the child.
- **[Text]** Decreto 12.880 art. 25 §2, IV (written for app stores and operating systems) mentions measures against multiple accounts used to get around age assurance. Art. 27 requires a way to contest an assessed age.
- **[Interp. and design recommendations]**
  1. **Neutral age gate at sign-up:** ask for a full date of birth without saying what the threshold is. Do not offer a "Yes, I'm 12+" button, pre-fill the field or default to an adult year.
  2. **No immediate retry:** when someone enters an under-12 date, end the flow with a kind message. Do not create an account. Remember the refusal on the device (for example a short-lived cookie) so that changing the year does not open the gate straight away.
  3. **Store the minimum:** keep the date of birth or derived age band only for age purposes (ECA Digital art. 13). Do not store anything about refused under-12 attempts.
  4. **Accounts found to belong to under-12s:** triggered by a report, the user's own content or a guardian's contact. Suspend the account straight away and keep it private. Ask for an age confirmation that can be contested (Decreto 12.880 art. 27). If it is confirmed, or not answered within a short deadline, delete the account and its data. Contacting a parent is allowed under LGPD art. 14 §3 (once, not stored). Log the decision without keeping the child's data.
  5. **Say it plainly:** the terms, sign-up screen and guardians' page should state the minimum age and the 12–15 and 16–17 rules, and show the age rating.
  6. **The anonymous catalogue stays open to everyone:** it collects no personal data, so it raises no LGPD issue for children. It is still subject to the ECA Digital general duties (section 4.2), such as no ad profiling and no manipulative design.
- **[Conservative]** Add a second layer for doubtful cases. In 2027 the ANPD will judge whether age assurance is proportionate to risk, and a lone self-declared date is the weakest option.

---

## 6. Current features that are a problem for minors

| Feature (code) | Issue | Basis | Conservative fix |
|---|---|---|---|
| Public profile `/u/$username` (`src/routes/u.$username.tsx`) with name, avatar, bio and binder | Exposes minors' data to anyone; it is the main source of condition III risk | ECA Digital art. 7 (most protective default), art. 24 §5; LGPD art. 14 caput | Private by default (already planned). For under-16s without a linked guardian: never public. For 16–17: opt-in only, with a clear explanation, and `noindex` |
| Free-text `bio` (`user.bio` in `src/server/db/schema.ts`) | A teen may publish their school, city, contact details or social handles, which invites contact by adults. It is also user content that falls under the takedown duties | ECA Digital arts. 6 (II, III), 17 §4 I, 28–30; LGPD art. 6 III (necessity) | For minors: hide the bio, or remove it, or limit length and filter URLs, @handles, phone numbers and emails. Add a report button |
| `name` shown as the main title, plus the `image` avatar URL (any URL, possibly a selfie) | Real name plus face | ECA Digital art. 7 §2; ECA art. 17 (image and identity) | For minors: show only the username publicly, with no external avatar URL (initials avatar) |
| Collector OG image `/api/og/collector/$username` (`src/routes/api/og/collector.$username.tsx`), cached 1 h, plus `og:image`/`description` meta | Makes a shareable card with the name and stats that spreads beyond the platform and is crawled by link-preview bots | ECA Digital art. 7; art. 2 XII and the general ban on encouraging exposure | Return 404 or a generic image for private profiles and for all minors' profiles. Do not put the name in metadata for private profiles |
| Profile `share` button | Pushes the profile outward | as above | Hide it unless the profile is public |
| Wishlist and binder completion counts | Gamification can make the app more attractive and drive compulsive use | ECA Digital art. 8 IV; Decreto 12.880 art. 9 | Fine as a tool. Avoid streaks, "come back" notifications and rewards for time spent |

---

## 7. Open ambiguities, with the conservative reading

1. **Is the app "de acesso provável"?** Conditions I and II are clear; condition III is arguable. Conservative: in scope. The ANPD rejects counting compliance measures against it.
2. **Does art. 24 (guardian linking for under-16s) apply to non-social-networks?** The caput says all in-scope providers; the chapter and ANPD material say social networks. Conservative: link 12–15 year olds to a guardian, or start at 16. "Até 16" versus "menores de 16" is also unclear; the FAQ says "menores de 16".
3. **Is a self-declared birthdate enough?** No law forbids it here, but the ANPD calls it unreliable. The final age guide is unpublished (the draft is from May 2026). Conservative: use it as the first layer of a layered approach, documented in the risk assessment.
4. **Civil capacity for under-16s accepting the terms.** Probably void without representation (CC arts. 3 and 166). Conservative: the guardian accepts for 12–15.
5. **How art. 39 modulation applies to a one-person provider.** The ANPD must set objective criteria (art. 39 §3) and has not. Conservative: implement the light version of each duty rather than skipping any.
6. **LGPD high-risk status.** Res. 2/2022 art. 4 counts processing as high risk when a general criterion (large scale, or significant effect on rights) combines with a specific one (data of children or adolescents). If that applies, the small-agent relief no longer does (art. 3, I): the simplified ROPA (record of processing activities) under art. 9, and no need to appoint a DPO under art. 11 (a contact channel is still required). Today the scale is small, so the relief probably applies. Conservative: appoint a DPO channel anyway (art. 11 §2 counts it as good practice) and keep a full ROPA. I did not check this text for later amendments.
7. **Status of ANPD regulations as of 2026-11-25.** I could not confirm whether the enforcement and dosimetry regulations promised "from November 2026" are out. The parental-supervision standards (art. 17 §1) and the final age guide are not published as far as I could see. Recheck https://www.gov.br/anpd/pt-br/assuntos/eca-digital before implementing.
8. **Do the information duties in LGPD art. 14 §§2 and 6 apply to adolescents?** The text points to children. ECA Digital art. 16 extends information duties to adolescents and points back to art. 14. Conservative: yes.

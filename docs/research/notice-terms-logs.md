# Privacy notice, terms of use, and what we must log and keep

Research for issue #10: "What must the privacy notice and terms contain, and what must we log and keep?"
Researched 2026-11-25. **This is not legal advice.** The controller has no lawyer, so each point is tagged:

- **Text**: quoted or closely paraphrased from a primary source (statute, decree, ANPD resolution or guide, court).
- **Reading**: our interpretation. Where the law is ambiguous, the **conservative reading** is the one recommended.

Companion notes, kept out of this file to avoid duplication: `docs/research/processors-transfers.md` (#9: processors,
regions, LGPD art. 33 and ANPD SCCs) and `docs/research/better-auth-hardening.md` (#11: deletion, session cleanup).

## Sources and fetch status

| Source | URL | Status |
|---|---|---|
| LGPD, Lei 13.709/2018 (consolidated) | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm | Read through WebFetch. Planalto refuses `curl` (empty reply). The page's encoding is broken, so accents in the quotes were restored. |
| Marco Civil, Lei 12.965/2014 | https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm | WebFetch. Some long incisos came back only partly quoted (noted where it matters). |
| Decreto 8.771/2016, as amended by **Decreto 12.975/2026** | https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/decreto/d8771.htm · https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2026/decreto/D12975.htm | WebFetch |
| CDC, Lei 8.078/1990 (compiled) | https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm | WebFetch |
| Decreto 7.962/2013 (e-commerce) | https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2013/decreto/d7962.htm | WebFetch |
| ECA Digital, Lei 15.211/2025 | https://www.planalto.gov.br/ccivil_03/_Ato2023-2026/2025/Lei/L15211.htm | WebFetch. In force since **17 Mar 2026** (art. 41-A). |
| Código Civil, arts. 3–5 | https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm | WebFetch |
| Lei 9.279/1996 (industrial property), art. 132 | https://www.planalto.gov.br/ccivil_03/leis/l9279.htm | WebFetch |
| ANPD, *Guia orientativo: Cookies e proteção de dados pessoais* (v1.0, Oct 2022) | https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-cookies-e-protecao-de-dados-pessoais.pdf | Downloaded the PDF and read it in full (`pdftotext`) |
| ANPD, *Guia orientativo: Fornecedores de produtos ou serviços de TI: escopo e obrigações gerais do ECA Digital* (Oct 2026) | https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-fornecedores-de-produtos-ou-servicos-de-tecnologia-da-informacao.pdf | Downloaded the PDF and read the relevant sections |
| Resolução CD/ANPD 2/2022 (small processing agents) | https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022 | Downloaded the HTML and read it in full |
| Enunciado CD/ANPD 1/2023 (minors) | https://bibliotecadigital.mj.gov.br/bitstream/1/10215/1/Enunciado_ANPD_2023_1.pdf · https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-divulga-enunciado-sobre-o-tratamento-de-dados-pessoais-de-criancas-e-adolescentes | Text taken from the search result that quotes the MJ PDF. I did not open the PDF myself. |
| Resolução CD/ANPD 15/2024 (incidents), art. 10 | https://www.gov.br/anpd/pt-br/assuntos/noticias/anpd-aprova-o-regulamento-de-comunicacao-de-incidente-de-seguranca | The gov.br page for the resolution returned 404. The 5-year rule comes from ANPD's own news item and from search snippets of the DOU text. |
| STJ, REsp 1.738.651/MS (Informativo 678) | https://processo.stj.jus.br/jurisprudencia/externo/informativo/?aplicacao=informativo&acao=pesquisar&livre=%40CNOT%3D%27017783%27 | WebFetch |
| STJ, jurisprudence search (SCON) | https://scon.stj.jus.br/SCON/ | **Could not fetch** (302 to the home page). STJ case law on "fins econômicos" therefore comes only from web search. |
| Vercel request headers | https://vercel.com/docs/headers/request-headers (last_updated 2025-12-13) | WebFetch |
| The Pokémon Company legal page; TCGdex README | https://www.pokemon.com/us/legal · https://github.com/tcgdex/cards-database | WebFetch |

**Things that have changed recently** (2025–2026). Templates found online will be out of date on these points:
- The ANPD is now the **Agência** Nacional de Proteção de Dados, a regulatory agency, under Lei 15.352/2026 (the conversion of MP 1.317/2025). The ANPD's own Nov 2026 publications use the new name. Use "Agência Nacional de Proteção de Dados (ANPD)" in the notice.
- **Decreto 12.975/2026** (20 May 2026, in force after 60 days) amended Decreto 8.771/2016. It added log retention of the **source port** (art. 15-A), general duties for application providers (art. 16-A) and **mandatory terms-of-use contents** (art. 20-A).
- **ECA Digital** (Lei 15.211/2025) has been in force since 17 Mar 2026. It is regulated by Decreto 12.880/2026 and enforced by the ANPD.

---

## TL;DR

1. **Marco Civil art. 15: treat ourselves as obliged.** Keep application access logs for **6 months**, then delete them. Each log holds the IP, the **source port** if obtainable, and the date and time with time zone, all tied to the account. Store them **outside** anything that cascades on account deletion, because deleting an account must not delete these logs (Marco Civil art. 7 X, LGPD art. 16 I). Today the only IPs we store are in better-auth's `session` table, which cascades on user delete. That does not comply. Reasoning is in §3.
2. **No consent banner is needed** for essential cookies plus localStorage with no analytics. The ANPD cookie guide says consent is *not appropriate* for strictly necessary cookies, and that legitimate interest can be the legal basis. The duty to inform remains: a cookies/local-storage section in the privacy notice, linked from the footer. A banner is presented as a good-practice tool, not a duty. See §4.
3. **The privacy notice must contain** everything in LGPD art. 9 I–VII, the art. 18 rights and how to exercise them, the art. 19 deadlines, and a contact (an encarregado, or at least a channel under Res. 2/2022 art. 11). It must also cover legal bases per purpose, retention including the 6-month logs, international transfers (US processors), TCGdex as a third party, the security measures we use (Decreto 8.771 art. 16) and the minors rules. Skeleton in §5.
4. **The terms of use must contain** the provider's identity (business name, CNPJ, physical and electronic address: Decreto 7.962 art. 2). Read conservatively, the CDC applies to free services. They must also contain the **notification system, due process and an annual transparency report** that Decreto 8.771 art. 20-A (2026) now requires of *every* application provider, plus a content and abuse channel (art. 16-A II). Add Brazilian forum, highlighted limitation clauses (CDC art. 54 §4), an account-deletion rule and the unofficial fan-site disclaimer. Skeleton in §6.
5. **Biggest flag, minors (outside the original question):** the ECA Digital art. 24 caput requires that accounts of under-16s on any service "de acesso provável" by minors be **linked to a parent's or guardian's account**. A Pokémon app is very likely "acesso provável". Separately, under-16s cannot contract alone under the Civil Code (art. 3). **The conservative options are a minimum age of 16, or guardian-linked accounts for ages 12–15.** This needs its own ticket. See §2.6.

---

## 1. What the app actually processes (from the code)

| Data | Where | Note |
|---|---|---|
| Name, email, username, display username, bio, favourite card, avatar URL | `user` table, `src/server/db/schema.ts` | Bio and avatar are user-generated content shown on public profiles when the user opts in |
| Password hash | `account` table | Legacy Go tables also hold copies (ADR 0004) |
| Session token, **IP, user agent**, expiry | `session` table (L116–117). FK to `user` with `onDelete: 'cascade'` | Captured once, when the session is created. Not a log of each access. Removed when the user is deleted. Expired rows are not purged (see #11) |
| Wishlist, collection | `wishlist_items`, `collection_items` (cascade) | |
| Verification tokens | `verification` | Magic link and password reset |
| Session cookie(s) | better-auth, `__Secure-` / HttpOnly / SameSite=Lax | Essential |
| localStorage `pokecards-cache` | `src/lib/persist.ts` | Opted-in queries (sets, cards opened, **wishlist and collection**), `maxAge` 1 day, on the device |
| Service-worker caches | `src/sw.ts` | Card images, catalog |
| Visitor IP and Referer sent to `assets.tcgdex.net` | browser | TCGdex is a third party, not our processor (see #9) |

No analytics, no ads, no tracking pixels.

---

## 2. Privacy notice: what the law requires

### 2.1 The core list (LGPD art. 9). **Text**

> Art. 9º O titular tem direito ao acesso facilitado às informações sobre o tratamento de seus dados, que deverão ser
> disponibilizadas de forma clara, adequada e ostensiva acerca de, entre outras características previstas em
> regulamentação para o atendimento do princípio do livre acesso:
> I - finalidade específica do tratamento;
> II - forma e duração do tratamento, observados os segredos comercial e industrial;
> III - identificação do controlador;
> IV - informações de contato do controlador;
> V - informações acerca do uso compartilhado de dados pelo controlador e a finalidade;
> VI - responsabilidades dos agentes que realizarão o tratamento; e
> VII - direitos do titular, com menção explícita aos direitos contidos no art. 18 desta Lei.

- **§3 (text):** where processing is a condition of the service, "o titular será informado com destaque sobre esse fato e sobre os meios pelos quais poderá exercer os direitos do titular elencados no art. 18". → *Reading:* add a highlighted line saying that an account requires an email, a username and a password or magic link.
- **Art. 8 §6 (summary of text):** if items I, II, III or V of art. 9 change, the controller must inform the data subject and highlight what changed. → Keep the notice versioned, with a changelog, and email account holders about material changes.
- **Art. 6 (text):** the principles of purpose limitation (*finalidade*), *adequação*, *necessidade*, free access (*livre acesso*), data quality (*qualidade*), *transparência* ("informações claras, precisas e facilmente acessíveis"), *segurança*, *prevenção*, non-discrimination (*não discriminação*) and accountability (*responsabilização e prestação de contas*).
- **Marco Civil art. 7 VIII (text, partially fetched):** users have a right to "informações claras e completas sobre coleta, uso, armazenamento, tratamento e proteção de seus dados pessoais", and data may be used only for purposes that "a) justifiquem sua coleta; b) não sejam vedadas pela legislação; e c) estejam especificadas nos contratos de prestação de serviços ou em termos de uso de aplicações de internet".
- **Decreto 8.771 art. 16 (text):** "As informações sobre os padrões de segurança adotados pelos provedores de aplicação ... devem ser divulgadas de forma clara e acessível a qualquer interessado, preferencialmente por meio de seus sítios na internet". → *Reading:* the notice needs a short **"Segurança"** section (hashing, TLS, access control, MFA on admin accounts, encryption at rest by the provider). This is often missed.

### 2.2 Legal bases per purpose (LGPD art. 7). **Reading**, built on the text

Bases in art. 7 (text): I consent; II "cumprimento de obrigação legal ou regulatória"; V "quando necessário para a execução de contrato ou de procedimentos preliminares relacionados a contrato ... a pedido do titular"; VI "exercício regular de direitos em processo judicial, administrativo ou arbitral"; IX "legítimos interesses do controlador ou de terceiro, exceto no caso de prevalecerem direitos e liberdades fundamentais do titular". Art. 10 §2 (text): when relying on legitimate interest, the controller "deverá adotar medidas para garantir a transparência". Art. 37 (text): keep a record of processing operations, "especialmente quando baseado no legítimo interesse".

For minors, Enunciado CD/ANPD 1/2023 (text): processing of children's and adolescents' data "poderá ser realizado com base nas hipóteses legais previstas no art. 7º ou no art. 11 ... desde que observado e prevalecente o seu melhor interesse, a ser avaliado no caso concreto". So consent is not mandatory for adolescents. Art. 14 §1 (text) still requires parental consent for **children** (under 12), which is moot because we do not admit under-12s.

| Purpose | Data | Basis (proposed) | Retention |
|---|---|---|---|
| Create and run the account; sign-in (password or magic link); password reset emails | name, email, username, password hash, verification tokens | Art. 7 V (contract). *For ages 12–15, see §2.6* | While the account exists; tokens until used or expired |
| Wishlist, binder, set progress | card ids, quantities, timestamps | Art. 7 V | While the account exists |
| Public profile (off by default) | username, display name, bio, avatar, favourite card, binder stats | Art. 7 V, the user switching on a feature. *Conservative alternative:* art. 7 I consent, revocable by switching it off, since a public profile is optional | Until switched off or the account is deleted |
| Session security (session cookie; IP and UA on the session row; "your devices" list) | session token, IP, UA | Art. 7 IX (security, fraud prevention). Cookie guide: legitimate interest fits strictly necessary cookies | Session lifetime, then purge (#11) |
| Rate limiting and abuse prevention | IP (in memory or a short-lived table) | Art. 7 IX | Minutes to hours |
| **Application access logs (Marco Civil art. 15)** | IP, source port, date and time with time zone, account id | Art. 7 II (legal obligation), if art. 15 applies (§3). If it does not, art. 7 IX | **6 months**, then delete (Decreto 8.771 art. 13 §2) |
| Offline cache on the device | localStorage copy of sets, opened cards, own wishlist and binder | Art. 7 V or IX. The user's own data, on their own device, for the offline feature they use | 1 day `maxAge`. *Recommend clearing it on sign-out* |
| Answering rights requests, complaints and authorities; defending claims | request records, correspondence | Art. 7 II and VI | See §7 |
| Terms and notice acceptance record | user id, version, timestamp | Art. 7 II / V (accountability, art. 6 X) | Life of the account plus the limitation period (see §7) |

State plainly that there is **no** advertising, profiling, sale of data or automated decision-making (LGPD art. 20 does not apply). For minors, ECA Digital art. 26 forbids behavioural profiling for advertising (cited in the ANPD guide).

### 2.3 Rights and how to exercise them (LGPD arts. 18, 19). **Text**

Art. 18 (text): rights obtainable "a qualquer momento e mediante requisição": I confirmation that processing exists; II access; III correction of "dados incompletos, inexatos ou desatualizados"; IV anonymisation, blocking or deletion of unnecessary or excessive data; V portability "de acordo com a regulamentação da autoridade nacional"; VI deletion of data processed with consent "exceto nas hipóteses previstas no art. 16"; VII information on the "entidades públicas e privadas com as quais o controlador realizou uso compartilhado"; VIII information on the possibility of refusing consent and its consequences; IX revocation of consent (art. 8 §5).

- §1: right to petition **the ANPD**. §8: also "perante os organismos de defesa do consumidor". → Name both, with Procon and consumidor.gov.br as examples.
- §2: right to object (*oposição*) to processing based on a basis other than consent, "em caso de descumprimento ao disposto nesta Lei".
- §3, §5: requests come from the data subject or a legal representative, are free of charge ("sem custos para o titular").
- §6: tell processors to repeat any correction or deletion.
- **Art. 19 (text):** confirmation or access "I - em formato simplificado, imediatamente; ou II - por meio de declaração clara e completa ... fornecida no prazo de até 15 (quinze) dias". §3: where the basis is consent or **contract**, the data subject may request a "cópia eletrônica integral de seus dados pessoais ... em formato que permita a sua utilização subsequente". → *Reading:* this is a real reason to build the JSON export #11 lacks. Until then, promise to answer within 15 days by email.
- **Marco Civil art. 7 X (text, partially fetched):** right to "exclusão definitiva dos dados pessoais que tiver fornecido a determinada aplicação de internet, a seu requerimento, ao término da relação entre as partes, ressalvadas as hipóteses de guarda obrigatória de registros previstas nesta Lei" (wording per the consolidated text). → The notice must say that deletion removes everything **except** the 6-month access logs and any records kept for legal obligations.
- **LGPD art. 16 (text):** after processing ends, data may be kept for "I - cumprimento de obrigação legal ou regulatória pelo controlador".

### 2.4 Contact: encarregado or channel. **Text** and **Reading**

- LGPD art. 41 caput and §1 (text): the controller "deverá indicar encarregado", and "a identidade e as informações de contato do encarregado deverão ser divulgadas publicamente ... preferencialmente no sítio eletrônico do controlador".
- Res. CD/ANPD 2/2022 art. 11 (text): small processing agents "não são obrigados a indicar o encarregado", **but** §1: those that do not "deve[m] disponibilizar um canal de comunicação com o titular". §2: appointing one anyway counts as good governance.
- Who is a small agent (art. 2 I): includes microempresas and EPPs and "pessoas naturais". **Excluded** (art. 3 I) are those doing "tratamento de alto risco". Under art. 4, high risk requires **both** a general criterion (large scale, or something that "possa afetar significativamente interesses e direitos fundamentais") **and** a specific one. One specific criterion is (II d) "dados pessoais de crianças, de adolescentes e de idosos".
- *Reading:* adolescents' data meets the specific criterion. A small catalog and binder app is probably **not** large scale and probably does not "significantly affect" fundamental rights, so we probably qualify for the small-agent regime. Res. 2/2022 art. 6 (text) is explicit that the regime does not exempt us from the rest of the LGPD.
- **Conservative recommendation:** name the owner as encarregado anyway, with name and a dedicated email such as `privacidade@…`. It costs nothing and removes the doubt.

### 2.5 International transfers (LGPD art. 33). Summary; details in #9

Art. 33 (text) permits transfer only in listed cases. Among them: I adequate countries; II safeguards such as standard clauses; VIII "consentimento específico e em destaque ... com informação prévia sobre o caráter internacional da operação"; IX "quando necessário para atender as hipóteses previstas nos incisos II, V e VI do art. 7º". `processors-transfers.md` concludes that Vercel, Neon/Databricks, Resend and GitHub all process in the US and that none offers the ANPD SCCs. The notice should name each processor, its role, the country (USA) and the mechanism relied on.

### 2.6 Minors (ages 12–17). **Text**, with a major **reading** flag

- **LGPD art. 14 caput (text):** processing of children's and adolescents' data "deverá ser realizado em seu melhor interesse". §6 (text): information "deverá[ão] ser fornecidas de maneira simples, clara e acessível, consideradas as características físico-motoras, perceptivas, sensoriais, intelectuais e mentais do usuário". The literal addressee is children, but **reading:** write a plain-language summary at the top that a 12-year-old can follow.
- **Enunciado 1/2023:** any art. 7 basis, provided the best interest prevails (above).
- **Civil Code (text):** art. 3: "São absolutamente incapazes de exercer pessoalmente os atos da vida civil os menores de 16 (dezesseis) anos". Art. 4 I: those aged 16–17 are "relativamente" incapable. → *Reading:* a 12–15-year-old cannot validly accept the terms alone, so the contract basis (art. 7 V) is shaky without a parent. A 16–17-year-old needs a parent's *assistência*, which is customarily handled by a "you confirm your parent or guardian agrees" clause.
- **ECA Digital (Lei 15.211/2025), in force 17 Mar 2026 (text):**
  - Scope (art. 1 sole paragraph): services "de acesso provável" by minors, meaning sufficient likelihood of use and attractiveness, ease of access, or significant risk. The ANPD guide (Oct 2026) treats this functionally: attractive design, characters and themes count, and self-declared exclusions do not. *Reading:* a Pokémon card app is very likely "acesso provável".
  - **Art. 7:** "garantir, por padrão, a configuração no modelo mais protetivo disponível em relação à privacidade e à proteção de dados pessoais". §1 requires clear information so that the minor and guardians can make informed choices about less protective settings. → Profiles **private by default** already meet this. Keep it that way.
  - **Art. 24 caput:** providers "direcionados a crianças e a adolescentes ou de acesso provável por eles dever[ão] garantir que usuários ou contas de crianças e de adolescentes de até 16 (dezesseis) anos de idade estejam vinculados ao usuário ou à conta de um de seus responsáveis legais". The ANPD guide discusses art. 24 under "Rede social", but the **caput's text is not limited to social networks**. §§1–4 are. → **Conservative reading: it applies to us.** §5: without a guardian account, settings may not be lowered below the protective default.
  - Art. 8 (risk management, age-rating information), art. 10 ("mecanismos para proporcionar experiências adequadas à idade") and Decreto 12.880 art. 47 (impact assessment, per the ANPD guide) also apply, modulated by size (art. 39). Art. 9 §1 (age verification "vedada a autodeclaração") applies to content **improper** for minors. *Reading:* that does not describe a card catalog.
- **Recommendation (outside this ticket's scope; open a new ticket):** either (a) set the **minimum age at 16**, with self-declaration plus a parental-assistance clause for ages 16–17, or (b) build guardian-linked accounts for ages 12–15. Option (a) is far cheaper and removes both the Civil Code and the ECA Digital art. 24 problems. Whichever we choose, the notice and terms must describe it truthfully.

---

## 3. Marco Civil art. 15: are we obliged to keep access logs?

### 3.1 Text

Lei 12.965/2014:

> Art. 15. O provedor de aplicações de internet constituído na forma de pessoa jurídica e que exerça essa atividade de
> forma organizada, profissionalmente e com fins econômicos deverá manter os respectivos registros de acesso a
> aplicações de internet, sob sigilo, em ambiente controlado e de segurança, pelo prazo de 6 (seis) meses, nos termos
> do regulamento.
> § 1º Ordem judicial poderá obrigar, por tempo certo, os provedores de aplicações de internet que não estão sujeitos
> ao disposto no caput a guardarem registros de acesso a aplicações de internet, desde que se trate de registros
> relativos a fatos específicos em período determinado.
> § 2º A autoridade policial ou administrativa ou o Ministério Público poderão requerer cautelarmente a qualquer
> provedor de aplicações de internet que os registros de acesso a aplicações de internet sejam guardados, inclusive
> por prazo superior ao previsto no caput, observado o disposto nos §§ 3º e 4º do art. 13.
> § 3º Em qualquer hipótese, a disponibilização ao requerente dos registros de que trata este artigo deverá ser
> precedida de autorização judicial ...

- Art. 5 VII (text): "aplicações de internet: o conjunto de funcionalidades que podem ser acessadas por meio de um terminal conectado à internet".
- Art. 5 VIII (text): "registros de acesso a aplicações de internet: o conjunto de informações referentes à data e hora de uso de uma determinada aplicação de internet a partir de um determinado endereço IP".
- **Decreto 8.771 art. 15-A (added by Decreto 12.975/2026, text):** the duty to keep IP records under art. 15 "abrangerá a porta lógica de origem associada sempre que necessário para a identificação inequívoca do terminal de origem". §1: it "independerá de prévia requisição e recairá autonomamente sobre cada provedor".
- **Decreto 8.771 art. 13 (text):** security guidelines: I strict access control; II authentication mechanisms for access to the records, "por exemplo, sistemas de autenticação dupla"; III "inventário detalhado dos acessos aos registros ... contendo o momento, a duração, a identidade do funcionário ... e o arquivo acessado"; IV "técnicas que garantam a inviolabilidade dos dados, como encriptação". §2: retain "a menor quantidade possível de dados pessoais ... e registros de conexão e acesso a aplicações, os quais deverão ser excluídos: I - tão logo atingida a finalidade de seu uso; ou II - se encerrado o prazo determinado por obrigação legal".
- Art. 16 (text): providers "onerosa ou gratuita" may not keep "II - de dados pessoais que sejam excessivos em relação à finalidade".
- Art. 10 and §1 (text, partial): records are disclosed **only under a court order**.

### 3.2 Case law

- **STJ, REsp 1.738.651/MS** (3rd Panel, Min. Nancy Andrighi, 25 Aug 2020, Informativo 678; **text** of the summary): it is legally possible to order application providers to supply the IPs and registration data of users who accessed a profile. The court restates the duty in the statute's words, for providers constituted "na forma de pessoa jurídica e que exerçam essa atividade de forma organizada, profissionalmente e com fins econômicos". It ties the duty to the ban on anonymity (CF art. 5 IV) and to the general duty to keep business records (CC art. 1.194). It does **not** construe "fins econômicos".
- **STJ, HC 626.983/PR** (6th Panel, 2022, Informativo 724; search result only): the MP may require provisional preservation of logs beyond the legal period without prior judicial authorisation, but access still requires a court order.
- **On free services:** a line of STJ cases, usually cited as REsp 1.186.616/MG (Nancy Andrighi, 2011) and the Orkut cases, holds that "o fato de o serviço prestado pelo provedor de serviço de internet ser gratuito não desvirtua a relação de consumo, pois o termo 'mediante remuneração', contido no art. 3º, § 2º, do CDC, deve ser interpretado de forma ampla, de modo a incluir o ganho indireto do fornecedor". *Found only through secondary sources (Jus.com.br); SCON could not be fetched to confirm the case number or ementa.* This concerns the **CDC**, not art. 15.
- **I found no STJ decision that construes "fins econômicos" in art. 15 for a free, ad-free service.** That gap is the main uncertainty here.

### 3.3 The four elements, applied

| Element | Our case | Reading |
|---|---|---|
| "constituído na forma de pessoa jurídica" | Run "through their own CNPJ" | **Ambiguity.** If the CNPJ belongs to an *empresário individual* or MEI, civil-law doctrine says it is not a legal person (CC art. 44 lists the types; the individual entrepreneur keeps a single estate), even though it has a CNPJ. If it is a *sociedade limitada unipessoal* (SLU), it plainly is one. *Conservative:* treat either as satisfying the element. Courts and authorities look at the CNPJ. |
| "de forma organizada" | A continuously running public service with accounts, infrastructure and a deploy pipeline | Satisfied |
| "profissionalmente" | Operated under a business registration rather than as a private hobby | Likely satisfied |
| "com fins econômicos" | Free, no ads, no data sales | **Contested.** For: a business CNPJ exists by definition to carry on "atividade econômica organizada" (CC art. 966); the STJ reads "remuneração" broadly as including indirect gain such as reputation, a portfolio or a future monetisation option; the service sits in a commercial ecosystem (cards are bought and sold). Against: no revenue of any kind; the provision targets commercial operators; art. 15 §1 exists precisely for providers outside the caput. |

### 3.4 Verdict

**Conservative reading: yes, comply with art. 15.** Keep application access logs for 6 months.

Reasons:
- Running the service through a CNPJ makes the "pessoa jurídica ... profissionalmente" elements hard to deny.
- There is no case law carving out free services, and the STJ's broad reading of indirect remuneration points the other way.
- §2 lets police or the MP require *any* provider to preserve logs. Without logs we could not comply with such a request.
- The cost is a small table and a purge job.

Not complying risks the sanctions of art. 12 (warning, fines, suspension). Under art. 15 §4, those are graded by gravity, advantage gained and repeat offence.

The **opposite** reading (not obliged, since nothing is earned) is defensible, but we could not prove it in advance. If we did not keep logs, we would also still need some basis for the session-table IPs.

### 3.5 Exactly what to keep. **Reading**, derived from the text

One row per **use of the application by an identified account**, in a dedicated `access_log` table:

| Field | Why |
|---|---|
| `occurred_at`, a UTC `timestamptz` (render with the time zone when disclosing) | Art. 5 VIII "data e hora". A time zone is needed to match an IP to an ISP subscriber |
| `ip` (v4 or v6, full, not truncated) | Art. 5 VIII |
| `source_port`, nullable | Decreto 8.771 art. 15-A "sempre que necessário". **Vercel exposes no client-port header**: its documented request headers are `x-forwarded-for`, `x-vercel-forwarded-for`, `x-real-ip` and geo headers, with no port. Record `null` and keep a note in the record of processing that the port is technically unavailable on our host. Revisit if we move hosts. |
| `user_id`, **not** an FK with cascade | So the log outlives account deletion. Also snapshot `username` (and optionally the email) for the 6 months; see below |
| `event` (`sign_up`, `sign_in`, `session_refresh`, `profile_update`, `account_delete`, …) | Not required by the text, but needed to make the log useful to a court |

**Granularity.** The text says "data e hora de uso". Logging *every* HTTP request would be excessive (art. 16 II; Decreto 8.771 art. 13 §2). *Conservative but proportionate:* log every authentication event (sign-up, sign-in, magic-link use, session refresh or renewal), every write that publishes or changes user content (bio, avatar, profile visibility, username) and account deletion. Anonymous browsing of the catalog involves no account and no user content. Do **not** log anonymous visitors.

**Retention and deletion.** Roll over at 6 months: a daily job deletes rows with `occurred_at < now() - interval '6 months'` (Decreto 8.771 art. 13 §2 II requires deletion once the legal period ends). The exception is rows under a preservation request (§2), which carry a `legal_hold_until` field.

**Security.** Decreto 8.771 art. 13: restrict access to the owner's account, use MFA on Neon, Vercel and GitHub, keep a small access inventory (who queried the log, when, why), and rely on the provider's encryption at rest. Never expose the log in the app or in user exports to third parties. Disclose it only under a court order (art. 10 §1, art. 15 §3).

**Interaction with account deletion.** Marco Civil art. 7 X and LGPD art. 16 I allow keeping these logs after deletion. *Reading:* on deletion, remove the user, account, sessions, binder and wishlist (cascade), but keep the `access_log` rows until they age out. Write the account id and username into the log row at write time, so a court order 5 months later can still be answered. Keeping the email in the snapshot is more useful but less minimal. *Recommendation:* keep the username and a hash of the email, which matches a court-supplied email without storing it in clear. The notice must say all this (Marco Civil art. 7 X).

**Current gap.** The `session` table's IP and UA are not an access log: one row per session, deleted on sign-out or account delete, and expired rows never purged. Fixing this is a code ticket: new table, write hooks in better-auth `databaseHooks`/`hooks.after` and the profile service, plus a purge cron.

---

## 4. Do we need a cookie or consent banner?

**Text (ANPD cookie guide, Oct 2022):**
- Necessary cookies are those "utilizados para que o site ou aplicação realize funções básicas e opere corretamente ... Essa categoria se restringe ao essencial para prestar o serviço solicitado pelo titular" (p. 10).
- "não é apropriado utilizar a hipótese legal do consentimento nas hipóteses de cookies estritamente necessários", because there is no real choice (p. 20).
- "o legítimo interesse poderá ser a hipótese legal apropriada nos casos de utilização de cookies estritamente necessários" (p. 24). Its example 3 is a shop's authentication and cart cookies under legitimate interest.
- A cookie policy "pode ser apresentada: (i) como uma seção específica do Aviso de Privacidade; (ii) em um local específico e separado; ou (iii) no próprio banner" (p. 29).
- The banner section calls its guidance "orientações não exaustivas, consideradas como boas práticas" (p. 30). The anti-patterns it lists (a lone "aceito" button and so on) apply "no caso de utilizar a hipótese legal do consentimento" (p. 33).
- The guide notes that the same issues can arise "com o uso de tecnologias similares" (p. 6). It does not single out localStorage.
- It is a non-binding guide (v1.0, open to contributions).

**Reading:**
- Brazil has **no ePrivacy-style rule** making storage on a device conditional on consent. The only framework is the LGPD, which requires a legal basis plus transparency. With only the auth session cookie(s), the localStorage offline cache of the user's own data, and service-worker caches, all strictly necessary for features the user asked for, **no consent banner is required**.
- Showing an "Aceitar" banner would actually misrepresent the legal basis.
- **Required:** a "Cookies e armazenamento local" section in the privacy notice, listing each item, its purpose, duration and legal basis, and explaining how to clear it (browser settings, sign-out). Link it from every page footer.
- **Optional:** a one-line, dismissible notice ("Usamos apenas cookies essenciais e armazenamento local para o modo offline. Saiba mais."). This is not required, and it must not look like a consent request.
- **Trigger to revisit:** adding analytics (even Vercel Analytics), embeds, error tracking with session replay, or ads makes those non-necessary. The guide then expects consent with a reject-all button on the first layer, consent-based cookies off by default, and a second layer by category.
- Recommendation: clear the `pokecards-cache` localStorage on sign-out. It holds the wishlist and binder, which on a shared device is personal data visible to the next user.

---

## 5. Privacy notice skeleton ("Aviso de Privacidade", pt-BR authoritative, EN translation)

Plain-language summary first, for teenagers (LGPD art. 14 §6 by analogy; ECA Digital art. 7 §1). Version and date at the top. Keep previous versions archived.

0. **Resumo em linguagem simples**: 6–8 bullets: what we collect, why, that the profile is private by default, no ads or tracking, how to delete, who to talk to.
1. **Quem somos (controlador)**: business name, CNPJ, physical address (an empresa's registered address; consider a virtual office if the CNPJ uses a home address), contact email (art. 9 III–IV).
2. **Encarregado / canal de privacidade**: name and email (art. 41 §1; Res. 2/2022 art. 11).
3. **Quais dados tratamos**: table by category: account; profile; binder and wishlist; technical (session IP and UA, access logs); on-device storage; communications with us. State that we **do not** collect sensitive data, location, contacts or payment data.
4. **Para que e com qual base legal**: the table from §2.2 (art. 9 I, art. 7, art. 10 §2). Highlight the data needed for an account (art. 9 §3).
5. **Perfil público**: off by default; what becomes visible when it is switched on; how to switch it off (ECA Digital art. 7).
6. **Crianças e adolescentes**: minimum age; parent or guardian role; best interest; no profiling or ads (LGPD art. 14; ECA Digital arts. 7, 24, 26). *Contents depend on the decision in §2.6.*
7. **Cookies e armazenamento local**: list, purpose, duration, basis, how to clear; no consent banner because everything is essential (ANPD cookie guide).
8. **Com quem compartilhamos**: processors (Vercel, Neon/Databricks, Resend, GitHub if it stays in scope) with role and country; TCGdex image host as an independent third party that receives the IP and Referer; authorities **only under a court order** (art. 9 V; Marco Civil arts. 7 VII and 10). No sale, no ads.
9. **Transferência internacional**: USA, and the mechanism relied on (art. 33; see #9).
10. **Por quanto tempo guardamos**: per category, including **access logs for 6 months under Marco Civil art. 15, kept even after account deletion**, incident records for 5 years, acceptance records (art. 9 II; art. 16; Marco Civil art. 7 X).
11. **Segurança**: measures in plain language (Decreto 8.771 art. 16; LGPD art. 46). Incident notification commitment (art. 48; Res. 15/2024, 3 business days).
12. **Seus direitos**: list art. 18 I–IX in plain words; how to use each (in-app settings for edit, delete and export, or email); free of charge; deadlines (immediately in simplified form, 15 days in full, art. 19); the right to object (§2); the right to complain to the **Agência Nacional de Proteção de Dados (ANPD)** and consumer bodies (§§1 and 8).
13. **Exclusão de conta**: what is deleted and what is kept, and why (Marco Civil art. 7 X).
14. **Decisões automatizadas e perfilamento**: none (art. 20).
15. **Alterações deste aviso**: versioning; prior notice by email for material changes (art. 8 §6, art. 9 §2).
16. **Idioma**: the Portuguese version prevails; the English version is a courtesy translation.

## 6. Terms of use skeleton ("Termos de Uso", pt-BR authoritative, EN translation)

Does the CDC apply to a free service? CDC art. 3 §2 (text): "Serviço é qualquer atividade fornecida no mercado de consumo, mediante remuneração". *Reading:* given the STJ's broad reading (indirect gain), **assume the CDC applies**. That brings in art. 46 (text: contracts do not bind consumers "se não lhes for dada a oportunidade de tomar conhecimento prévio de seu conteúdo"), art. 47 (pro-consumer interpretation), art. 51 I (void clauses that "impossibilitem, exonerem ou atenuem a responsabilidade do fornecedor") and art. 54 §§3–4 (adhesion contracts in clear, legible text "não inferior ao corpo doze", with limiting clauses "redigidas com destaque"). Decreto 7.962 governs "contratação no comércio eletrônico" (art. 1). Applying it to a free service is a stretch, but its art. 2 identification items are cheap: *conservative: comply*.

1. **Quem presta o serviço**: business name, CNPJ, physical and electronic address (Decreto 7.962 art. 2 I–II). Customer-service channel by email (art. 4 V), with prompt acknowledgement (art. 4 VI).
2. **O que é o Poké Cards**: a free catalog, wishlist and binder; physical TCG only; data from TCGdex, community-maintained, and possibly incomplete. Say this as *information* (CDC art. 6 III), **not** as a blanket liability waiver (art. 51 I).
3. **Aviso de marca / site não oficial**: convention modelled on TCGdex ("not produced, endorsed, supported or affiliated with Nintendo or The Pokémon Company") and the official credit line ("© … Pokémon. © 1995–2026 Nintendo/Creatures Inc./GAME FREAK inc. Pokémon and Pokémon character names are trademarks of Nintendo."). Suggested pt-BR: "O Poké Cards é um projeto de fã, não oficial e gratuito. Não é produzido, endossado, apoiado nem afiliado à Nintendo, Creatures Inc., GAME FREAK inc. ou The Pokémon Company. Pokémon e os nomes dos personagens são marcas registradas da Nintendo; as imagens das cartas pertencem aos seus respectivos titulares." *Reading:* Lei 9.279 art. 132 IV (text) stops a trademark owner from preventing "a citação da marca em ... qualquer outra publicação, desde que sem conotação comercial e sem prejuízo para seu caráter distintivo". Staying free and ad-free protects that defence, and so does not using the Pokémon logo as our brand. Card **images** are copyrighted works, a separate copyright question not researched here. Add a takedown contact for rights holders.
4. **Quem pode usar / idade**: the minimum age and the parent or guardian clause (CC arts. 3–4; ECA Digital art. 24). *Depends on §2.6.*
5. **Sua conta**: accurate data; one person per account; keep credentials safe; usernames must not impersonate anyone or infringe rights.
6. **Conteúdo do usuário e regras de conduta**: bio, avatar URL and username. Forbidden: illegal content, harassment or bullying (ECA Digital art. 6 §2), sexual content, hate, spam, links to malware. The user keeps rights in their content and grants a licence to display it on the profile they choose to make public.
7. **Notificações, devido processo e transparência** (**required by Decreto 8.771 art. 20-A**, text: terms must "abranja[m], necessariamente: I - o sistema de notificações; II - o devido processo; e III - os relatórios anuais de transparência em relação a notificações extrajudiciais, anúncios e impulsionamentos"; §1: published and reviewed periodically): a permanent, easy-to-find reporting channel that expressly accepts reports of criminal or unlawful content (art. 16-A II); what happens after a report; telling the affected user the specific ground and how to contest (art. 16-E); an expedited path for content violating children's rights (ECA Digital art. 29); a short **annual transparency report** (even "0 notices, 0 ads"). Art. 16-P lets the authority set lighter criteria for "pequenos provedores", but none had been issued when we checked.
8. **Suspensão e encerramento**: grounds; notice and the right to contest; account deletion by the user at any time (link to the notice for what is kept).
9. **Disponibilidade e mudanças no serviço**: a free service, offered as is, with **reasonable** limits on liability for downtime or data errors. Write these **in bold or highlighted** (CDC art. 54 §4) and never as a total exclusion (art. 51 I and IV).
10. **Privacidade**: link to the privacy notice. The two documents are separate (Marco Civil art. 7 VIII c expects purposes to appear in the terms or contracts, so cross-reference them).
11. **Alterações dos termos**: versioning, prior notice, new acceptance for material changes (CDC art. 46).
12. **Lei aplicável e foro**: Brazilian law. Do **not** impose a foreign forum (Marco Civil art. 8 sole paragraph II, text: adhesion clauses that "não ofereçam como alternativa ao contratante a adoção do foro brasileiro" are void). Do not override the consumer's home forum (CDC art. 101 I, not re-fetched this session).
13. **Contato**: support email, privacy channel, abuse and rights-holder channel.
14. **Idioma**: the pt-BR version prevails.

**Acceptance mechanics (Decreto 7.962 art. 4 I, III, IV by analogy; CDC art. 46):** at sign-up, show links to both documents before the account is created; use an unticked checkbox or an explicit "Ao criar a conta você concorda…" with links; store `terms_version`, `privacy_version` and `accepted_at` per user; keep every version downloadable at a stable URL.

---

## 7. What to log and keep: retention register

| Record | Legal hook | Keep for | Notes |
|---|---|---|---|
| Application access logs (IP, port, timestamp, account) | Marco Civil art. 15; Decreto 8.771 arts. 13, 15-A | **6 months, then delete** (art. 13 §2) | Survives account deletion. Legal-hold flag for §2 requests |
| Access inventory for those logs (who queried them, when, why) | Decreto 8.771 art. 13 III | Same as the logs, or longer | A text file or table is enough for a one-person operator |
| Terms and notice acceptance (user, version, timestamp) | CDC art. 46; LGPD art. 6 X; art. 8 §2 if consent is ever used | Life of the account plus 5 years (*reading:* CDC art. 27's 5-year limitation on damages claims, not re-fetched this session) | Delete together with other account data unless needed for a pending claim |
| Record of processing operations (ROPA) | LGPD art. 37; simplified allowed by Res. 2/2022 art. 9 | Ongoing | One page: purposes, data, bases, processors, retention |
| Rights requests and replies | LGPD arts. 18–19; accountability (art. 6 X) | *Reading:* 5 years | Proves the 15-day deadline was met |
| Security incident register, **including incidents not reported** | Res. CD/ANPD 15/2024 art. 10 (5-year minimum, per ANPD) | **≥ 5 years** | Communications to the ANPD and data subjects within 3 business days (art. 6, per search snippets) |
| Content notices, decisions, appeals; annual transparency report | Decreto 8.771 arts. 16-E, 20-A | *Reading:* 5 years | |
| Preservation requests from police or the MP | Marco Civil art. 15 §2 | Until the requested date passes | |
| ECA Digital risk and impact assessment | ECA Digital art. 8 I; Decreto 12.880 art. 47 (per the ANPD guide) | Ongoing, kept updated | Proportionate to size (art. 39) |
| Session rows (IP, UA) | Security (LGPD art. 7 IX) | Session expiry, then purge | Fix in #11 |
| Vercel and Neon platform logs | n/a | Platform default | Not relied on as the art. 15 log, because platform retention is short and outside our control |

---

## 8. Open questions for the owner

1. **What is the CNPJ's legal form**: MEI or empresário individual, or SLU? It affects §3.3 and which business name and address to publish.
2. **Minimum age decision** (§2.6): 16+, or guardian-linked accounts for ages 12–15? This blocks the minors section of both documents.
3. **Physical address to publish** (Decreto 7.962 art. 2 II): is the registered address a home address?
4. Do we name an encarregado (recommended) or just a channel?
5. Is the Neon role used by GitHub Actions going to be restricted (removing GitHub as a processor, see #9)? That changes the list of processors in the notice.

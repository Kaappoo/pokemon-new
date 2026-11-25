# LGPD: does Poké Cards qualify as a small-scale processing agent, and what duties remain?

Research for issue #8, "Is Poké Cards a small-scale processing agent, and which LGPD duties remain?"
Researched on 2026-11-25. This is not legal advice, and the controller has no lawyer. Every conclusion is marked as either
**fact** (quoted or closely paraphrased from a primary source) or **reading** (our interpretation). Where a provision is
ambiguous, the **conservative reading** is given and labelled as such.

Context assumed: a free card browser with accounts. We hold name, email, username, bio, wishlist, collection, session
IP and user agent, and a password hash or session tokens. Profiles are private by default, with an opt-in public profile.
Teenagers aged 12 to 17 may hold accounts. The service is run by a Brazilian individual through their own CNPJ, but we
don't know the CNPJ type (MEI, ME or other). There are no real users yet.

## TL;DR

- **Small-agent status: yes for a MEI, ME or EPP, and for a startup under LC 182, as long as revenue stays under the
  caps.** This holds unless the processing is "high risk", and it is not high risk today (reading). For an "other" CNPJ
  type it is only probably yes (see the table below).
- **The high-risk test needs both legs.** Processing has to meet ≥1 general criterion (large scale, *or* able to
  significantly affect fundamental rights and interests) **and** ≥1 specific criterion. Teenagers' data meets a specific
  criterion on its own, permanently. So the switch is the *general* criterion. At launch we are not at large scale.
  Public profiles of minors with free-text bios are the most likely way to be argued into "significantly affect…
  image and reputation". **Conservative reading:** don't let minors' profiles be public, or strip them down, so the
  general leg stays clearly unmet. Write that assessment down, because the ANPD can ask us to prove eligibility within
  15 days.
- **Duties that remain even as a small agent (fact):**
  - a channel for data subjects (the encarregado itself is optional);
  - a simplified record of processing (ANPD template exists);
  - essential security measures, plus an optional simplified security policy;
  - data-subject rights;
  - incident notification and an incident register kept for 5 years;
  - the public child/teen-data notice under art. 14 §2;
  - an RIPD whenever the ANPD orders one;
  - all LGPD principles and legal bases.
- **Deadlines for a small agent (fact):**
  - incident notice to the ANPD and to data subjects: **6 business days** (3 doubled);
  - supplementing an incident notice: **40 business days** (20 doubled);
  - simplified access confirmation: **up to 15 days**, instead of "immediately";
  - full access declaration: **30 days** (15 doubled);
  - documents the ANPD requests: double the normal deadline;
  - other art. 18 rights: **no regulated deadline exists yet**. Conservatively, answer within 15 days.
- **Losing the exemption (high risk, or revenue over the cap) brings back:**
  - a formally appointed encarregado, published on the website;
  - the full record of processing;
  - single deadlines: 3 business days for incidents, immediate simplified access, 15 days for the full declaration.

## 1. Who counts as a small-scale processing agent (agente de tratamento de pequeno porte, ATPP)

**Fact.** Res. CD/ANPD nº 2/2022, Annex, art. 2 I defines ATPP as "microempresas, empresas de pequeno porte,
startups, pessoas jurídicas de direito privado, inclusive sem fins lucrativos, nos termos da legislação vigente, bem como
pessoas naturais e entes privados despersonalizados que realizam tratamento de dados pessoais, assumindo obrigações típicas
de controlador ou de operador".
Art. 2 II defines ME/EPP as sociedade empresária, sociedade simples, sociedade limitada unipessoal and the empresário of
Civil Code art. 966, "incluído o microempreendedor individual", registered and meeting "art. 3º e 18-A, § 1º da Lei
Complementar nº 123". Art. 2 III defines startups by reference to Chapter II of LC 182/2021.
Sources: [ANPD consolidated text, Res. 2/2022](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022)
(page states "alterado pela Resolução CD/ANPD nº 15", modified 16/09/2026). Original DOU text of 28/01/2022:
[in.gov.br](https://in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-2-de-27-de-janeiro-de-2022-376562019). We read it from a
DOU print hosted on [gov.br/palmares](https://www.gov.br/palmares/pt-br/midias/arquivos-menu-acesso-a-informacao/legislacao/resolucao-cd-anpd-n2-2022.pdf),
because in.gov.br returned HTTP 502 to our fetcher for this page.

**Fact (exclusions).** Res. 2/2022 art. 3 says the differentiated treatment is unavailable to an ATPP that:
- (I) "realizem tratamento de alto risco para os titulares";
- (II) earns gross revenue above LC 123 art. 3 II, or above LC 182 art. 4 §1 I for startups;
- (III) belongs to an economic group whose global revenue exceeds those limits.

**Fact (revenue caps).**
- LC 123 art. 3: a microempresa has gross revenue ≤ R$ 360.000,00 per calendar year (I). An empresa de pequeno porte has
  more than R$ 360.000,00 and up to **R$ 4.800.000,00** (II, as amended by LC 155/2016).
  [planalto LC 123](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm)
- LC 182 art. 4 §1: startup status covers the empresário individual, EIRELI, sociedades empresárias, cooperativas and
  sociedades simples. The conditions are:
  - (I) revenue up to **R$ 16.000.000,00** in the previous year;
  - (II) up to 10 years of CNPJ registration;
  - (III) either a declaration of an innovative business model in the constitutive act, or enrolment in Inova Simples.

  [planalto LC 182](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp182.htm)
- We did not read the MEI ceiling in LC 123 art. 18-A §1, because the fetch was truncated before that article. It
  doesn't change the answer: a MEI is named expressly in Res. 2 art. 2 II, and its ceiling sits far below the EPP cap.

### Per CNPJ type

| CNPJ type | Qualifies? | Basis |
|---|---|---|
| **MEI** | Yes (fact), unless high risk | Named expressly in Res. 2 art. 2 II. |
| **ME / EPP** (empresário individual, SLU/Ltda, sociedade simples) | Yes (fact) while revenue ≤ R$ 4,8 mi (own and group), unless high risk | Res. 2 art. 2 II and art. 3 II–III; LC 123 art. 3. |
| **Startup** (LC 182) | Yes (fact) while revenue ≤ R$ 16 mi, CNPJ ≤ 10 years old and the innovation declaration is in place, unless high risk | Res. 2 art. 2 III and art. 3 II. |
| **Other** (for example an S.A., or a company not framed as ME/EPP) | **Probably yes (reading)** | Art. 2 I also covers "pessoas jurídicas de direito privado" generally, and art. 3 II only applies the LC 123 revenue *cap*. Ambiguous; see the open ambiguities. |
| Any type with revenue above the cap | No (fact) | Res. 2 art. 3 II–III. |

**Reading.** A free, revenue-less service run through any of these CNPJ types sits well under every revenue cap. The
deciding question is therefore high risk, not size.

**Fact (burden of proof).** Res. 2 art. 5 says the ATPP must, "quando solicitado pela ANPD, comprovar que se enquadra nas
disposições do art. 2º e do art. 3º deste regulamento em até quinze dias". **Reading:** keep the CNPJ card, the revenue
records and a written high-risk assessment on file.

**Fact (ANPD override).** Res. 2 art. 16 says the ANPD "poderá determinar ao agente de tratamento de pequeno porte o
cumprimento das obrigações dispensadas ou flexibilizadas", considering "a natureza ou o volume das operações, bem como os
riscos para os titulares".

## 2. Does processing teenagers' data or offering public profiles make it high risk?

**Fact.** Res. 2 art. 4 counts processing as high risk when it meets "**cumulativamente** a pelo menos um critério geral
e um critério específico":
- General criteria:
  - (a) "tratamento de dados pessoais em larga escala"; or
  - (b) "tratamento de dados pessoais que possa afetar significativamente interesses e direitos fundamentais dos
    titulares".
- Specific criteria:
  - (a) emerging or innovative technologies;
  - (b) surveillance of publicly accessible areas;
  - (c) decisions taken solely on automated processing, including profiling;
  - (d) "utilização de dados pessoais sensíveis ou de dados pessoais de crianças, de adolescentes e de idosos".
- §1: large scale means a "número significativo de titulares", also considering volume, duration, frequency and
  geographic extent.
- §2: significant effect covers, among other situations, processing that "puder impedir o exercício de direitos ou a
  utilização de um serviço, assim como ocasionar danos materiais ou morais aos titulares, tais como discriminação,
  violação à integridade física, ao direito à imagem e à reputação, fraudes financeiras ou roubo de identidade".

[ANPD consolidated text](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022), art. 4.

Applied to Poké Cards (reading):

| Criterion | Met? | Why |
|---|---|---|
| Specific (d): adolescents' data | **Yes, as soon as one 12–17 account exists** | The text says "dados pessoais … de adolescentes", with no threshold. "Idosos" could also apply. |
| Specific (a)–(c) | No | No novel technology, no surveillance, no solely-automated decisions about people. |
| General (a): large scale | **No at launch.** Undefined later | No numeric threshold exists in any binding text. |
| General (b): significant effect | **Arguable only through public profiles** | Private-by-default card lists don't plausibly harm image or reputation. A *public* teen profile with a free-text bio and avatar is exposure that a regulator could tie to "direito à imagem e à reputação". |

**Conclusion (reading).** Not high risk today, so the exemptions apply. Adolescent data makes the specific leg
permanent, which means one general criterion is all it takes to lose the exemptions. **Conservative design choices:**
- keep minors' profiles non-public, or allow only a username and card lists with no bio or avatar;
- re-assess if the user count grows "significantly";
- write the assessment down (Res. 2 art. 5).

Public profiles of *adults* don't trigger the specific leg, so on their own they don't make the processing high risk.

**Fact (no ANPD guide yet).**
- Res. 2 art. 4 §3 says the ANPD "poderá disponibilizar guias" on high risk.
- The ANPD's guide list (checked 2026-11-25) contains **no** high-risk guide:
  [Materiais educativos e publicações](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes).
- The ANPD's own balance of the 2025–2026 regulatory agenda (first half of 2026) says of item 7 (Guide on high risk and
  large scale): "A versão final encontra-se no Conselho Diretor para aprovação".
  [Balanço 1º sem/2026 (PDF)](https://www.gov.br/anpd/pt-br/assuntos/regulacao/agenda-regulatoria-1/agenda-regulatoria-2025-2026/balanco-agenda-regulatoria-2025-2026-01-2026.pdf/@@display-file/file), p. 16.
- A secondary source (a law firm, not primary, so unverified) reports that an earlier draft proposing ≥ 2 million data
  subjects as automatically large scale was **not** approved (Voto nº 11/2025/DIR-MW/CD):
  [Mattos Filho](https://www.mattosfilho.com.br/unico/anpd-guia-dados-risco/). Treat no number as authoritative.

**Fact (children's data legal bases).** Enunciado CD/ANPD nº 1/2023: "O tratamento de dados pessoais de crianças e
adolescentes poderá ser realizado com base nas hipóteses legais previstas no art. 7º ou no art. 11 da [LGPD], desde que
observado e prevalecente o seu melhor interesse, a ser avaliado no caso concreto, nos termos do art. 14 da Lei."
[DOU 24/05/2023](https://www.in.gov.br/en/web/dou/-/enunciado-cd/anpd-n-1-de-22-de-maio-de-2023-485306934).
**Reading:** for 12–17 year olds, parental consent (art. 14 §1, written for *crianças*) isn't mandatory if another legal
basis fits, for example contract performance (art. 7 V). The best-interest test still applies.

## 3. Duties that remain, whether or not we qualify

**Fact.** Res. 2 art. 6: the waivers do "não isenta[r] … do cumprimento dos demais dispositivos da LGPD, inclusive das
bases legais e dos princípios, … bem como direitos dos titulares."

### 3.1 Encarregado (DPO) or communication channel

| | As a small agent | Not a small agent |
|---|---|---|
| Encarregado | **Optional** (fact): "não são obrigados a indicar o encarregado" (Res. 2 art. 11). Appointing one counts as good governance under LGPD art. 52 §1 IX (art. 11 §2). | **Mandatory** (fact): "O controlador deverá indicar encarregado" (LGPD art. 41). |
| If not appointed | Must provide "um canal de comunicação com o titular de dados para atender o disposto no art. 41, § 2º, I" (Res. 2 art. 11 §1; restated in Res. 18/2024 Annex art. 3 §3). | n/a |
| If appointed | Res. 18 applies, in full under the conservative reading:<br>• appointment by a formal, written, dated, signed act (art. 3, §1), shown to the ANPD on request (§2);<br>• full name and contact published "em local de destaque e de fácil acesso, no sítio eletrônico" (art. 9, §1–§2);<br>• a formally designated substitute (art. 4);<br>• must communicate in Portuguese (art. 13);<br>• no certification required (art. 14). | Same. |

Sources: [Res. 2 consolidated](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022);
[Res. CD/ANPD nº 18/2024 (DOU 17/07/2024)](https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-18-de-16-de-julho-de-2024-572632074);
[LGPD art. 41](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm).

**Fact.** Res. 18 art. 19 §1 II says a conflict of interest "pode se configurar … com o acúmulo das atividades de
encarregado com outras que envolvam a tomada de decisões estratégicas sobre o tratamento de dados pessoais pelo
controlador". **Reading:** a sole owner naming themselves encarregado is open to a conflict-of-interest objection. A
one-person ATPP is better off using the art. 11 waiver with a channel (for example a dedicated `privacidade@` address
listed in the privacy policy). If the exemption is lost, the owner may have to be the encarregado anyway. That is
untested; see the open ambiguities.

**Fact (incident filing).** Res. 15/2024 art. 6 §5: an incident notice must be filed "por meio do encarregado …
ou por meio de representante constituído". Art. 6 §2 VIII asks for "os dados do encarregado ou de quem represente o
controlador". **Reading:** without an encarregado, the owner files as the controller's representative.

### 3.2 Record of processing (ROPA, registro das operações de tratamento)

- **Fact.** LGPD art. 37: "O controlador e o operador devem manter registro das operações de tratamento de dados
  pessoais que realizarem, especialmente quando baseado no legítimo interesse."
- **Fact.** Res. 2 art. 9: ATPPs "podem cumprir a obrigação … de forma simplificada". The ANPD will provide a model.
- **Fact.** The ANPD publishes a one-page "Modelo de registro das operações de tratamento de dados pessoais para agentes
  de tratamento de pequeno porte (ATPP)":
  [modelo_de_ropa_para_atpp.pdf](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/modelo_de_ropa_para_atpp.pdf/@@display-file/file),
  linked from the
  [security guide page](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte).
  Its fields:
  - organisation, CNPJ, address, main activity, responsible manager, email, phone, date;
  - categories of data subject ("Titulares em geral / **Crianças e adolescentes** / Idosos");
  - personal data types;
  - sharing (flows and named third parties);
  - security measures (with a pointer to the guide's checklist);
  - retention period;
  - process, purpose and legal basis (LGPD arts. 7 and 11);
  - observations (encarregado, processors, international transfers).
- **Reading.** Keep this record internally. It doesn't have to be published, but it must be producible: the ANPD may ask
  for it in an incident (Res. 15 art. 8). Without small-agent status, no simplified form is authorised, and a fuller
  record is expected.

### 3.3 RIPD (data protection impact report)

**Fact.**
- LGPD art. 5 XVII defines the RIPD as controller documentation describing processing "que podem gerar riscos às
  liberdades civis e aos direitos fundamentais", plus mitigation measures.
- Art. 38: "A autoridade nacional poderá determinar ao controlador que elabore relatório de impacto … nos termos de
  regulamento". Its single paragraph sets the minimum content: data types, collection method, security methodology and
  the analysis of mitigation measures.
- Art. 10 §3: the ANPD "poderá solicitar" an RIPD when the processing rests on legitimate interest.
- Res. 15/2024 art. 8: in an incident the ANPD may request "o registro das operações …, o relatório de impacto à proteção
  de dados pessoais (RIPD) e o relatório de tratamento do incidente".

[LGPD](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm);
[Res. 15/2024](https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-15-de-24-de-abril-de-2024-556243024).

**Fact (no regulation yet).** The ANPD's regulations index lists no RIPD regulation as of today
([Regulamentações da ANPD](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd)).
The first-half-2026 agenda balance (item 2) says the RIPD regulation is still "em finalização de elaboração do RAIR".

**Reading.**
- No text requires an RIPD proactively, from small agents or from anyone else. It is owed **when the ANPD orders it**.
- An ATPP gets **double the deadline** the ANPD sets for documents (Res. 2 art. 14 IV).
- Res. 2 doesn't waive the RIPD.
- **Conservative reading:** if session IP and user agent are kept under *legitimate interest*, an RIPD is the most likely
  request (art. 10 §3). A short internal RIPD covering teen accounts, public profiles and session logs is cheap insurance.

### 3.4 Security measures

**Fact.**
- LGPD art. 46: agents "devem adotar medidas de segurança, técnicas e administrativas aptas a proteger os dados pessoais
  de acessos não autorizados e de situações acidentais ou ilícitas…".
- Res. 2 art. 12: ATPPs "devem adotar medidas administrativas e técnicas essenciais e necessárias, com base em requisitos
  mínimos de segurança da informação", considering the risk and the agent's reality. Following the ANPD's guides "será
  considerado como observância ao disposto no art. 52, § 1º VIII".
- Res. 2 art. 13: ATPPs "podem estabelecer política simplificada de segurança da informação". The ANPD weighs its
  existence under arts. 6 X and 52 §1 VIII–IX.
- The ANPD's
  [Guia orientativo: Segurança da informação para ATPP](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-sobre-seguranca-da-informacao-para-agentes-de-tratamento-de-pequeno-porte)
  and its [checklist](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/checklist-vf.pdf/@@display-file/file) list,
  among others:
  - a simplified security policy, reviewed periodically;
  - access control with least privilege;
  - **multi-factor authentication** to access systems or databases holding personal data;
  - strong, non-reused passwords;
  - data minimisation;
  - encryption (TLS/HTTPS);
  - a WAF or firewall;
  - patching;
  - offline backups;
  - an SLA contract with cloud providers.
- A binding minimum-security regulation is still pending: agenda item 5, "em fase de elaboração de relatório de AIR"
  (Balanço 1º sem/2026).

### 3.5 Data-subject requests and their deadlines

| Request | Standard deadline | Small agent | Source (fact) |
|---|---|---|---|
| Simplified confirmation or access (art. 19 I) | "imediatamente" | **Up to 15 days** from the request | LGPD art. 19 I; Res. 2 art. 15 |
| Clear and complete declaration of origin, criteria and purpose (art. 19 II) | Up to 15 days | **30 days** (double) | LGPD art. 19 II; Res. 2 art. 14 III |
| Other art. 18 rights (correction, deletion, portability, consent withdrawal, etc.) | "nos prazos e nos termos previstos em regulamento" (art. 18 §5). **No such regulation exists.** | "prazo em dobro … nos termos de regulamentação específica" (Res. 2 art. 14 I), so there is nothing to double yet | LGPD art. 18 §§3–5; Res. 2 art. 14 I |
| If unable to act immediately | Reply stating either that we are not the agent, or the reasons of fact or law (art. 18 §4) | Same | LGPD art. 18 §4 |
| Cost to the data subject | Free (art. 18 §5) | Same | LGPD art. 18 §5 |
| Channel | Any channel ensuring "acesso facilitado" (electronic, printed or other) | Same | Res. 2 art. 7 |

**Fact.** A data-subject-rights regulation (agenda item 1, covering LGPD arts. 9, 18, 20 and 23) has a published RAIR.
It "aguarda-se a deliberação do Conselho Diretor sobre a realização de consulta pública" (Balanço 1º sem/2026, p. 14).
**Conservative reading:** until the regulation is out, answer every art. 18 request within 15 days, using the art. 19
II benchmark. That stays inside any doubled deadline the regulation might later set.

### 3.6 Security incidents

**Fact (Res. CD/ANPD nº 15/2024,
[DOU 26/04/2024](https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-15-de-24-de-abril-de-2024-556243024)).**

- **When notification is required (art. 5).** The incident must be able to "afetar significativamente interesses e
  direitos fundamentais" **and** involve at least one of:
  - sensitive data;
  - "dados de crianças, de adolescentes ou de idosos";
  - financial data;
  - "dados de autenticação em sistemas";
  - data under legal secrecy;
  - large-scale data.

  **Reading:** we hold teen data and authentication data (password hashes, session tokens), so a breach of the user
  tables will very likely meet the second leg.
- **To the ANPD (art. 6):** "no prazo de três dias úteis", counted "do conhecimento pelo controlador de que o incidente
  afetou dados pessoais" (§1). Filed via the ANPD electronic form (§4), by the encarregado or a constituted
  representative, with proof of authority (§5–§6). It may be supplemented within 20 business days (§3). The notice must
  give the number of affected teens separately (§2 II) and state, where applicable, that the controller is an ATPP (§2
  IX).
- **Doubling (art. 6 §8):** "Os prazos constantes no caput e no § 3º deste artigo são contados em dobro para os agentes
  de pequeno porte". That makes **6 and 40 business days**.
- **To data subjects (art. 9):** within 3 business days, in plain language, direct and individual (email counts, §2).
  If that isn't possible, by public notice on the site for at least three months (§3). §6 doubles the caput deadline for
  ATPPs, making **6 business days**.
- **Declaration to the ANPD that data subjects were told (art. 9 §4):** "em até três dias úteis, contados do término do
  prazo" of art. 9. **Not stated as doubled.** Conservative reading: 3 business days after the (doubled) data-subject
  deadline ends.
- **Incident register (art. 10):** keep a record of **every** incident, "inclusive daquele não comunicado", for **at
  least five years**. Minimum content:
  - date of knowledge;
  - circumstances;
  - nature and category of the data;
  - number of data subjects;
  - risk assessment;
  - mitigation;
  - form and content of the notices;
  - reasons for not notifying.
- **Res. 15 art. 2 rewrote Res. 2 art. 14 II.** The original text removed the doubling where there was "potencial
  comprometimento à integridade física ou moral dos titulares". The new wording simply refers to Res. 15, which doubles
  without that exception. **Reading:** the doubling now applies to every ATPP incident. **Conservative reading:** because
  the old carve-out concerned harm to physical or moral integrity, notify within 3 business days anyway whenever teens'
  safety could be at stake (for example, exposed private profiles).
- **Without small-agent status:** 3 business days for the ANPD and data subjects, 20 to supplement.

### 3.7 What must be published, and what must be kept on file

**Publish (fact unless marked).**
- **Processing information** under LGPD art. 9: purpose, form and duration, controller identity and contact, sharing,
  responsibilities, data-subject rights. Accessible through any channel ensuring "acesso facilitado" (Res. 2 art. 7).
  **Reading:** in practice this is a Portuguese privacy policy, and the app has none today (see
  [processors-transfers.md](processors-transfers.md)).
- **Teen and child data notice**, LGPD art. 14 §2: controllers "deverão manter pública a informação sobre os tipos de
  dados coletados, a forma de sua utilização e os procedimentos para o exercício dos direitos". The information must be
  simple, clear and accessible (§6).
  **Reading:** §2 refers to "dados de que trata o § 1º", which is *children's* data. Conservative reading: publish it for
  12–17 accounts too.
- **The data-subject channel** (Res. 2 art. 11 §1). If an encarregado is appointed, publish their identity and contact
  on the website (LGPD art. 41 §1; Res. 18 art. 9).
- **When the ANPD orders it:** wide publicity of an incident (Res. 15 art. 19), or a public incident notice for at least
  3 months when individual notice is impossible (art. 9 §3).

**Keep on file (fact unless marked).**
- **Simplified ROPA** (LGPD art. 37; Res. 2 art. 9).
- **Incident register**, ≥ 5 years (Res. 15 art. 10).
- **Evidence of ATPP eligibility**, producible within 15 days (Res. 2 art. 5). *Reading:* CNPJ card, revenue figures and
  the written high-risk assessment.
- **Simplified security policy**: optional, but it counts in our favour (Res. 2 art. 13).
- **Encarregado appointment act**, only if one is appointed (Res. 18 art. 3).
- **RIPD**, only if ordered. A voluntary internal RIPD is advisable (reading).
- **Copies of data-subject requests and responses.** *Reading:* this is how we demonstrate accountability (LGPD art. 6 X).

## 4. Adjacent obligations (outside this ticket, flagged)

- **Marco Civil da Internet, art. 15 (fact).** An application provider "constituído na forma de pessoa jurídica e que
  exerça essa atividade de forma organizada, profissionalmente e com fins econômicos deverá manter os respectivos
  registros de acesso a aplicações de internet, sob sigilo, em ambiente controlado e de segurança, pelo prazo de 6 (seis)
  meses". Art. 5 VIII: access records are the date and time of use from an IP.
  [planalto](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm).
  **Reading:** whether a free service run through a CNPJ has "fins econômicos" is unclear. If it applies, it gives a
  legal-obligation basis (LGPD art. 7 II) for keeping session IP and timestamp for 6 months, and a cap to delete after.
- **ECA Digital, Lei 15.211/2025 (fact).** It applies to IT products or services "direcionado a crianças e a
  adolescentes" or with "acesso provável" by them (art. 1). It has been in force since **17 March 2026** (art. 41-A, per
  Lei 15.352/2026). Obligations are modulated by "o número de usuários e o porte do fornecedor" (art. 39). There is no
  blanket small-provider exemption.
  [planalto](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15211.htm).
  The ANPD removed "Tratamento de dados de crianças e adolescentes" from its LGPD agenda because of this law (Balanço 1º
  sem/2026, p. 13). Its age-assurance guide (item 15) was in tomada de subsídios from 22/05 to 09/07/2026.
  **Reading:** a Pokémon card app with teen accounts is plausibly "acesso provável". **This needs its own ticket.**

## Open ambiguities (conservative reading in bold)

1. **"Significativamente afetar" and public teen profiles.** No guide defines it. **Treat public profiles of minors
   (bio, avatar) as able to tip the processing into high risk. Keep them private or minimal.**
2. **Large scale has no number.** The 2M figure appeared only in an unapproved draft (secondary source). **Re-assess
   periodically and record it. Don't rely on any number.**
3. **"Other" CNPJ types**, for example an S.A. or a company not registered as ME/EPP. Res. 2 art. 2 I is broad, but
   art. 2 II ties ME/EPP to LC 123. **If the CNPJ is neither MEI nor ME/EPP nor a startup, assume no exemption until
   confirmed.**
4. **Owner as encarregado.** Res. 18 art. 19 §1 II conflict of interest. **Use the art. 11 waiver plus a channel while
   eligible. If the exemption is lost, appoint formally and document why no conflict exists.**
5. **Art. 18 deadlines.** No regulation yet, so doubling has no base. **Answer within 15 days.**
6. **Art. 9 §4 declaration (incidents)** is not listed as doubled. **3 business days after the doubled data-subject
   deadline.**
7. **Removed carve-out for physical or moral integrity.** It was dropped from Res. 2 art. 14 II by Res. 15. **When
   minors' safety is at stake, notify within 3 business days anyway.**
8. **Art. 14 §2 publication duty** is literally about children (under 12). **Publish it for adolescents too.**
9. **Marco Civil art. 15 "fins econômicos"** for a free service. **Keep access logs for 6 months, then delete.**
10. **ANPD guide list date.** Our "no high-risk guide" finding rests on the materials page and the agenda balance as of
    the first half of 2026. **Re-check before relying on it.**

## Sources fetched

- [Res. CD/ANPD nº 2/2022, ANPD consolidated text](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022). The original DOU at in.gov.br returned HTTP 502, so we read a DOU print on [gov.br/palmares](https://www.gov.br/palmares/pt-br/midias/arquivos-menu-acesso-a-informacao/legislacao/resolucao-cd-anpd-n2-2022.pdf).
- [Res. CD/ANPD nº 15/2024, DOU](https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-15-de-24-de-abril-de-2024-556243024)
- [Res. CD/ANPD nº 18/2024, DOU](https://www.in.gov.br/en/web/dou/-/resolucao-cd/anpd-n-18-de-16-de-julho-de-2024-572632074)
- [Enunciado CD/ANPD nº 1/2023, DOU](https://www.in.gov.br/en/web/dou/-/enunciado-cd/anpd-n-1-de-22-de-maio-de-2023-485306934)
- [LGPD, compiled, planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm). Read through a fetch tool because direct curl got an empty reply. Quotations were checked against the tool's verbatim output; the page has encoding damage.
- [LC 123](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm) and [LC 182](https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp182.htm)
- [Marco Civil da Internet](https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm) and [Lei 15.211/2025, ECA Digital](https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2025/lei/L15211.htm)
- [ANPD regulations index](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd), [ANPD guides list](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes), [ATPP ROPA template](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/modelo_de_ropa_para_atpp.pdf/@@display-file/file), [ATPP security checklist](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/checklist-vf.pdf/@@display-file/file)
- [ANPD agenda balance, first half of 2026](https://www.gov.br/anpd/pt-br/assuntos/regulacao/agenda-regulatoria-1/agenda-regulatoria-2025-2026/balanco-agenda-regulatoria-2025-2026-01-2026.pdf/@@display-file/file)
- Secondary only, unverified: [Mattos Filho on the unapproved high-risk guide](https://www.mattosfilho.com.br/unico/anpd-guia-dados-risco/)

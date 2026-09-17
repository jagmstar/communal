# TEST PLAN v0.6 — communal: auth-периметр + логін-флоу (веб + APK)

> **Реліз:** v0.6 «APK-compatible cookie login gate» · коміт `97eb916`
> (16:08:59 +0300, 60 файлів, +1460/−59), поверх `8a719bf` → `46c8944` → `5ade499`
> **Артефакт APK:** `F:\communal\communal-app.apk`, зібраний **15:27:58**,
> SHA256 `9D1659A76BED9042DA99F230F856DDE4C61C0D831B9CD05CEC43DED376D2F14D`
> (не в git: `.gitignore:44 *.apk`)
> **Середовище:** прод `https://communal-navy.vercel.app` + AVD `letta_qa`,
> system image `android-34/google_apis/x86_64` (API 34)
> **Власник плану:** qa-lead (QAO) · **Дата:** 2026-09-17
> **Стратегія-батько:** `F:\communal\qa\TEST-STRATEGY.md`

VERDICT: **FAIL** — розділено навмисно, бо це два різні гейти:
- **Auth-периметр (INV-1/INV-2): PASS.** Перевірено мною, не взято зі звіту розробника: 12/12 обидва режими, `failures: 0`.
- **Client-facing UI gate (п.9 контракту qa-lead): FAIL.** Блокують **D1** (UI твердить клієнту неправду) і **D2** (ланцюг доказів логіну не стосується зібраного артефакту). Жодного реального пристрою не було.

Команди, виконані 2026-09-17 19:05–19:25 (+0300). Кожне число нижче — з них:

```
cd F:\communal ; npx vitest run src
  -> Test Files 19 passed (19) | Tests 193 passed (193) | Duration 34.62s | exit 0
cd "F:\AI SDLC rork\ai-sdlc-1.0-143" ; powershell -File deliverables\qa\communal-auth-killtest.ps1
  -> 12/12 PASS, === failures: 0 ===
... -File deliverables\qa\communal-auth-killtest.ps1 -Cookie communal_session=<REDACTED>
  -> 12/12 PASS, === failures: 0 ===
curl -X POST .../api/login  (хибний пароль, 13 разів, валідний JSON)
  -> 1..10 = 401 ; 11,12,13 = 429 {"error":"too_many_attempts"}
curl -X POST .../api/login  (12 разів, НЕВАЛІДНИЙ JSON)
  -> 12 x 400 {"error":"invalid_json"} — жодного 429
curl -X POST .../api/login  (правильний пароль з F:\dt-home\meta\.communal-login)
  -> 200, Set-Cookie: communal_session=<REDACTED>; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=2592000
curl -H "Cookie: <session>" .../api/readings
  -> "submittedToEps":true x12 ; "submittedToEps":false x1 (value 12600, date 2026-09-17)
curl -H "Cookie: <session>" .../api/settings   -> 200, 259 B
Get-ChildItem F:\communal\qa\android-2026-09-17\*.png   -> 21 файлів (01..21)
Get-Item F:\communal\communal-app.apk .LastWriteTime    -> 15:27:58
```

---

## 1. Дефекти

| # | Defect | Repro (команда/кроки) | Expected | Actual | Severity | Evidence (file:line / хвіст виводу) |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | Екран успіху твердить «передано на EPS», хоча інтеграції з EPS у коді не існує; дисклеймер про це **ховається саме на успіху** (інвертована логіка) | відкрити APK → Передати → обрати лічильник → ручний ввід → Передати | або інтеграція є, або текст каже правду («збережено, передача в розробці») | «Показник 12600 кВт·год **передано на EPS**», жодного дисклеймера. У БД цей самий запис лежить із `submittedToEps:false` | **High** — блокує client-facing gate | `F:\communal\src\app\submit\page.tsx:286` (`submittedToEps: false, // EPS integration is separate`), `:292` (`setEpsPlaceholder(false)` на успіху), `:296` (`true` лише на **помилці** API), `:671` (текст), `:681-687` (дисклеймер під `epsPlaceholder`); `F:\communal\src\lib\notifications.ts:253` `epsConnected: false`; скріншот `F:\communal\qa\android-2026-09-17\20-submit-success.png` |
| D2 | Ланцюг доказів логіну не стосується зібраного APK: скріншоти fresh-install+логіну зроблені ДО збірки артефакту | `Get-ChildItem F:\communal\qa\android-2026-09-17\*.png` + `Get-Item F:\communal\communal-app.apk` | доказ логіну зроблений на тому самому бінарнику, що релізиться | APK зібрано **15:27:58**; `10-fresh-install-login` **15:11:05**, `11-login-real` **15:11:57**, `12-password-typed` **15:12:12**, `13-after-login-attempt` **15:21:30** — усі раніше на 6–17 хв. Пост-збіркові лише `14..21` (15:29:02–15:32:57), а вони могли працювати на вже наявній 30-денній куці (`Max-Age=2592000`), тож логін на цьому бінарнику **не доведений жодним скріншотом** | **High** — блокує client-facing gate | mtime-таблиця вище; заявка в коміті `97eb916`: «fresh install -> login -> home ... screenshots qa/android-2026-09-17/10..21.png» |
| D3 | Реального пристрою не було — лише емулятор | — | п.9 контракту qa-lead: установити точний білд на підтримуваний реальний пристрій | AVD `letta_qa`, образ `android-34/google_apis/x86_64` | **High, unproven** | `F:\communal\qa\emulator_boot_out2.log`: «avd: `letta_qa`», `systemPath ...\android-34\google_apis\x86_64\` |
| D4 | 12 записів історії позначені `submittedToEps:true` за відсутності інтеграції — сідові дані виглядають як факт передачі | `curl -H "Cookie: <session>" .../api/readings` | прапорець відповідає реальності | `"submittedToEps":true` × 12 (усі з `mockData.ts`), `false` × 1 (справжній запис QA 12600 від 17.09) | Medium | `F:\communal\src\lib\mockData.ts:103-117`; хвіст `/api/readings` |
| D5 | Rate-limiter стоїть **після** `request.json()` — некоректні тіла не тротляться взагалі | 12× POST `/api/login` з невалідним JSON | лічильник спроб інкрементується або запит відкидається на межі | 12 × `400 invalid_json`, жодного 429 (ліміт 10/60с не спрацював) | Low (не є обходом автентифікації: вгадати пароль так неможливо; це амплітуда для DoS) | `F:\communal\src\app\api\login\route.ts`: `try { body = await request.json() } catch { 400 }` **перед** `isRateLimited(key)` |
| D6 | Rate-limiter in-memory per-instance — розподілені спроби через cold-start інстанси не обмежуються | — | KV-бекований лімітер | `const attempts = new Map<...>` у пам'яті процесу | Medium, **accepted** (задокументовано автором) | `F:\communal\src\app\api\login\route.ts`, комент «D7 ... single-instance in-memory limiter ... does NOT protect against distributed attempts» |
| D7 | CSRF при `SameSite=None` + 30-денна кука не перевірено | cross-site `POST /api/readings` із кукою жертви, `Content-Type: text/plain` | запис відхилено (немає CSRF-токена або строгий content-type) | **NOT RUN** | Medium, unproven | `F:\communal\src\lib\session.ts` (`SameSite=None`, `Max-Age=2592000`); токена CSRF у репо немає |
| D8 | `targetSdkVersion = 35`, а прогін лише на образі API 34 — цільовий рівень API не протестований | `adb` на образі android-35 | прогін на targetSdk | **NOT RUN** | Low | `F:\communal\android\variables.gradle:4` (`targetSdkVersion = 35`) проти `systemPath ...\android-34\...` |
| D9 | Ім'я власника в клієнтському payload — «Роман Кречих» (у компанії — Роман Крепич) | `curl -H "Cookie: <session>" .../api/settings` | прізвище клієнта написане правильно | `"userName":"Роман Кречих"` | P3 (можливо введено вручну — вимагає підтвердження Романа, не коду) | хвіст `/api/settings`, 259 B |
| D10 | Мутаційної перевірки немає: 193 зелених тести не доводять, що вони здатні впасти | `mutation`-прогін розрахункового шару | ≥1 мутант убитий на кожен критичний інваріант | **NOT RUN** — інструмента в репо немає | Medium (борг) | `F:\communal\package.json` — скриптів мутації немає |
| D11 | Гейти периметра (killtest, обидва режими) не в CI — тримаються на людині | `F:\communal\.github\workflows\ci.yml` | killtest як крок після деплою | CI має лише `tsc`, `vitest run src`, `npm audit` | Medium (борг) | `F:\communal\.github\workflows\ci.yml` |

Закриті цим релізом (перевірено мною повторно, не з чужого звіту):
**D-auth-1/2/6** (анонімний доступ до 8 маршрутів, витік EPS-ідентифікаторів
через `/api/settings`, відсутність `/login`) — killtest без куки 12/12.
**D3-CORS** з `deliverables\qa\communal-auth-gate-2026-09-17-round3.md`, що
був єдиним провалом ранкового прогону (`failures: 1`), — тепер PASS:
`acao='https://localhost' acac='true'`.
**D7-rate-limit**, що в round-3 стояв як `NOT RUN`, — виміряно: 401×10 → 429.

## 2. Сценарії релізу та фактичне покриття

| # | Сценарій | Очікуваний результат | Факт | Доказ |
| --- | --- | --- | --- | --- |
| S1 | Веб: анонім відкриває `/`, `/submit`, `/history`, `/settings` | 307 → `/login?next=…` | 4/4 307, 15 B тіла | killtest NO cookie |
| S2 | Веб: анонім стукає в `/api/{meters,readings,settings,tariffs}` | 401 | 4/4 401, 24 B | killtest NO cookie |
| S3 | Веб: публічні маршрути живі | `/login` 200, `/api/login` 405 на GET, `/api/health` 200 | так | killtest NO cookie |
| S4 | Веб: логін правильним паролем | 200 + `Set-Cookie` з `HttpOnly; Secure; SameSite=None` | так, `Max-Age=2592000` | curl-прогін вище |
| S5 | Веб: із сесією доступні всі 8 маршрутів | 8/8 200 | так (`/api/settings` 259 B, `/api/readings` 3223 B) | killtest WITH session |
| S6 | Native CORS-контракт для APK | `ACAO: https://localhost` + `ACAC: true` | так | killtest, проба `/api/meters(native)` |
| S7 | Brute-force логіну | тротлінг після розумної кількості спроб | 401×10, далі 429 | 13-кроковий curl-прогін |
| S8 | APK: fresh install → логін | вхід на зібраному артефакті | **НЕ ДОВЕДЕНО** — див. D2 | `10..13.png` раніше за APK 15:27:58 |
| S9 | APK: головний екран із реальними даними | прогноз, лічильники, підказки | прогноз 2 400,46 ₴, «4 лічильники» | `F:\communal\qa\android-2026-09-17\14-home-logged-in.png` |
| S10 | APK: історія | реальні показники по 4 лічильниках | так | `15-history.png`, `16-history-real.png` |
| S11 | APK: submit показника (ручний ввід) | запис збережено, підпис правдивий | збережено (12600, у БД `submittedToEps:false`), **підпис неправдивий** — D1 | `17..20.png`, хвіст `/api/readings` |
| S12 | APK: налаштування | дані профілю показані | так | `21-settings.png` |
| S13 | Юніт/компонентні тести | 0 fail | 193/193, 19 файлів | `npx vitest run src` |
| S14 | Реальний пристрій | логін + submit на фізичному телефоні | **NOT RUN** — D3 | — |
| S15 | Камера + OCR (tesseract) на реальній матриці | розпізнавання показника з фото | **NOT RUN** — обійдено через ручний ввід (`19-manual-entry.png`) | — |
| S16 | Аудіо / нотифікації | — | **NOT RUN** | — |
| S17 | Плаузибельність підказки на головному | порада має ненульову вигоду | «Знизь на 10% = **0 дерев**» — порада з нульовим ефектом (INV-4) | `14-home-logged-in.png` |

## 3. Про 21 скріншот (щоб їх не переоцінили)

`01..09` (14:46:40–14:59:51) — це **діагностика провалу** опції 3b, а не
доказ роботи: саме той стан, який Роман побачив о 09:43. `10..13`
(15:11:05–15:21:30) — логін-спроби на **до-релізному** бінарнику. `14..21`
(15:29:02–15:32:57) — єдині, зроблені після збірки `communal-app.apk`
(15:27:58). `full-logcat.txt` має mtime **14:51:14**, тобто логи теж
описують фазу провалу, а не зібраний артефакт.

Тому коректне формулювання: **12 з 21 скріншота стосуються фази провалу або
до-релізного бінарника; happy-path зібраного APK підтверджений 8 екранами,
і жоден із них не показує сам вхід у систему.**

## 4. Що мусить бути доведено, щоб v0.6 отримала sign-off

1. **D1** — або текст екрана успіху змінено на правдивий, або показано реальний виклик EPS. Мінімальний тест: `submit.test.tsx`-кейс, який падає, якщо `submittedToEps === false`, а в DOM є «передано на EPS».
2. **D2 + D3** — точний артефакт (SHA256 `9D1659A7…` або новіший) установлений на **реальний пристрій** після `adb uninstall`, скріншоти: екран логіну → введений пароль → home. Обов'язково зафіксувати модель і версію Android.
3. **D4** — визначитися: або сідові прапорці приводяться до `false`, або в UI з'являється розрізнення «збережено» / «передано».
4. Після кожного з пунктів 1–3 — повторити `npx vitest run src` і обидва режими killtest; `NOT RUN` не приймається як `PASS`.

Відомі обмеження, які я **не** вважаю блокерами v0.6 (із власником і датою,
company lesson-008): D5, D6 (власник senior-fullstack-dev, зафіксовано
2026-09-17), D7, D8, D10, D11 — власник qa-lead, перегляд 2026-09-24.

## 5. Як цей план переносити на інші продукти

Копіюється **структура**: VERDICT-рядок із розділенням гейтів → блок
фактично прогнаних команд → таблиця дефектів → таблиця сценаріїв із
колонкою «Факт» → розділ про доказову цінність скріншотів → перелік
«що мусить бути доведено». Правила, які роблять цей шаблон робочим:
1. кожен рядок таблиці має або команду, або `NOT RUN`;
2. `NOT RUN` ніколи не підвищується до `PASS`;
3. артефакт має хеш, середовище — ідентифікатор;
4. **час створення доказу порівнюється з часом збірки артефакту** (це те, що зловило D2);
5. числа зі звіту розробника перераховуються самостійно перед цитуванням.

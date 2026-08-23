# Communal — Product Requirements Document (PRD)

| Поле | Значення |
|------|----------|
| **Документ** | PRD |
| **Продукт** | Communal |
| **Власник** | Roman Krepych |
| **Автор** | Senior BA (JAGM-TWIN-034) |
| **Дата** | 2026-08-22 |
| **Статус** | Draft → Pending Owner Review |
| **Версія** | 1.0 |
| **Бізнес-бриф** | [2026-08-22-communal-brief.md](../business/2026-08-22-communal-brief.md) |

---

## 1. Контекст

Дивіться [Business Brief](../business/2026-08-22-communal-brief.md) для бізнес-проблеми, цільового користувача, цілей та обмежень. Цей PRD деталізує функціональні вимоги у форматі user stories з EARS acceptance criteria.

**EARS (Easy Approach to Requirements Syntax):** Кожна acceptance criteria використовує шаблон:
- `The system shall <action>` — безумовна вимога
- `When <trigger>, the system shall <action>` — подієва вимога
- `While <state>, the system shall <action>` — станова вимога
- `If <condition>, then the system shall <action>` — умовна вимога

## 2. Епіки

| Епік | Назва | User Stories |
|------|-------|-------------|
| E1 | Подача показників через OCR | US-1, US-2, US-3, US-4 |
| E2 | Історія та аналітика | US-5, US-6 |
| E3 | Прогноз рахунку та insights | US-7, US-8 |
| E4 | Нагадування | US-9 |
| E5 | Налаштування та профіль | US-10, US-11 |
| E6 | БД та API | US-12, US-13 |
| E7 | Android (Capacitor) | US-14, US-15 |

---

## 3. User Stories

### E1 — Подача показників через OCR

---

#### US-1: Обрати лічильник для подачі

**Як** Роман,
**я хочу** обрати лічильник зі списку,
**щоб** знати, для якого лічильника подавати показник.

**Приймальні критерії:**

- **AC-1.1:** The system shall display all configured meters as a scrollable list on the Submit page, each showing service name, meter number, last reading value, and last reading date.
- **AC-1.2:** When the user taps a meter card, the system shall navigate to the photo capture step for that meter.
- **AC-1.3:** The system shall display the selected meter's service name and meter number in the header of every subsequent step in the submission flow.
- **AC-1.4:** The system shall show a back button on all steps except the meter selection and the success confirmation, allowing return to the previous step.

---

#### US-2: Зробити фото лічильника

**Як** Роман,
**я хочу** сфотографувати дисплей лічильника через камеру телефону,
**щоб** не вводити цифри вручну.

**Приймальні критерії:**

- **AC-2.1:** When the user is on the photo step, the system shall display a camera viewfinder with a scanning frame overlay sized approximately 60% of the screen height.
- **AC-2.2:** The system shall display a tip below the viewfinder: "Наведіть камеру на дисплей лічильника. Цифри мають бути чітко видимими."
- **AC-2.3:** When the user taps the capture button, the system shall capture a photo from the device camera and pass it to the OCR engine.
- **AC-2.4:** While the photo is being captured, the system shall not allow duplicate capture attempts (disable the capture button).
- **AC-2.5:** The system shall display a privacy notice below the capture button: "Фото залишається на пристрої. На сервер передається лише цифра."
- **AC-2.6:** If the device camera is unavailable, the system shall display an error message: "Камера недоступна. Перевірте дозволи додатка." and offer a manual input fallback.

---

#### US-3: Розпізнати показник через OCR

**Як** Роман,
**я хочу** щоб додаток автоматично розпізнав цифри з фото лічильника,
**щоб** уникнути помилок ручного введення.

**Приймальні критерії:**

- **AC-3.1:** When the user captures a photo, the system shall display a loading indicator with the text "Розпізнаю цифри..." for the duration of OCR processing.
- **AC-3.2:** When OCR completes, the system shall display the recognized numeric value in a large, centered card with the meter's unit.
- **AC-3.3:** The system shall display the OCR confidence percentage as a badge below the recognized value, formatted as "Впевненість {N}%".
- **AC-3.4:** The system shall display an editable text input pre-filled with the OCR-recognized value, labeled "Виправити значення (за потреби)".
- **AC-3.5:** If the recognized value is less than the meter's last reading, the system shall display a warning: "Показник менший за попередній ({lastReading}). Перевірте значення." in a red-bordered alert card.
- **AC-3.6:** The system shall allow the user to edit the recognized value before submission.
- **AC-3.7:** If OCR fails to recognize any digits, the system shall display the message "Не вдалося розпізнати. Введіть значення вручну." and present an empty editable input.

---

#### US-4: Подати показник на eps.org.ua

**Як** Роман,
**я хочу** щоб додаток автоматично передав показник на eps.org.ua,
**щоб** не відкривати сайт і вводити значення вручну.

**Приймальні критерії:**

- **AC-4.1:** When the user taps "Передати на EPS", the system shall display a loading indicator with the text "Передаю на EPS...".
- **AC-4.2:** The system shall open a hidden WebView to eps.org.ua, inject JavaScript to authenticate (using stored credentials), navigate to the meter reading submission page, fill in the meter number and reading value, and submit the form.
- **AC-4.3:** When the EPS submission succeeds, the system shall display a success screen with a green checkmark, the submitted value, meter name, and meter number.
- **AC-4.4:** When the EPS submission fails, the system shall display an error message: "Не вдалося передати на EPS. Перевірте підключення та спробуйте ще раз." with a "Retry" button and a "Open EPS manually" fallback link.
- **AC-4.5:** The system shall store the submitted reading in the local database with: meterId, value, date, ocrConfidence, ocrEngine, submittedToEps=true, submittedAt timestamp.
- **AC-4.6:** When the submission is complete, the system shall offer two actions: "Передати ще один" (resets to meter selection) and "На головну" (navigates to home).
- **AC-4.7:** If the user taps "Передати на EPS" and EPS credentials are not configured, the system shall redirect to Settings → EPS Account section with a message "Спочатку налаштуйте EPS акаунт."

---

### E2 — Історія та аналітика

---

#### US-5: Переглянути історію витрати по лічильнику

**Як** Роман,
**я хочу** побачити графік витрати по місяцях для обраного лічильника,
**щоб** розуміти динаміку споживання.

**Приймальні критерії:**

- **AC-5.1:** The system shall display a horizontally scrollable meter selector at the top of the History page, with one pill button per meter showing the meter's service name (first word) and icon.
- **AC-5.2:** When the user selects a meter, the system shall display a bar chart showing monthly usage (difference between consecutive readings) for the last 12 months, using the meter's color.
- **AC-5.3:** The system shall display the meter's current tariff below the meter info header.
- **AC-5.4:** The system shall display a trend badge showing percentage change vs previous month, with an up arrow (orange) for increase and down arrow (green) for decrease.
- **AC-5.5:** The system shall display a monthly breakdown list below the chart, sorted newest first, with month name, usage value with unit, and cost in ₴.
- **AC-5.6:** The system shall display a "Аналітика" section placeholder: "Річні порівняння та аналітика будуть доступні після 6 місяців використання" when fewer than 6 months of data exist.
- **AC-5.7:** If no readings exist for the selected meter, the system shall display an empty state: "Поки немає даних. Передайте перший показник, щоб побачити графік."

---

#### US-6: Переглянути витрату за останній місяць

**Як** Роман,
**я хочу** бачити витрату та вартість за останній місяць,
**щоб** розуміти, скільки спожив і скільки платитиму.

**Приймальні критерії:**

- **AC-6.1:** The system shall display, below the chart, a summary row with "Витрата за останній місяць" (usage value + unit) on the left and "Вартість" (cost in ₴, formatted with uk-UA locale) on the right.
- **AC-6.2:** The system shall calculate cost as: (last reading − previous reading) × applicable tariff(s).
- **AC-6.3:** If multiple tariffs apply to a service (e.g., gas distribution + supply), the system shall sum all tariffs for that service type when calculating cost.

---

### E3 — Прогноз рахунку та insights

---

#### US-7: Переглянути прогноз рахунку

**Як** Роман,
**я хочу** бачити прогноз загального рахунку на поточний місяць,
**щоб** знати, скільки грошей зарезервувати.

**Приймальні критерії:**

- **AC-7.1:** The system shall display a hero card on the Home page showing the total predicted bill, formatted as "{amount} ₴" with uk-UA locale (minimum 2 decimal places).
- **AC-7.2:** The system shall display the label "Прогноз рахунку за {month}" where {month} is the current month name in Ukrainian.
- **AC-7.3:** The system shall display the count of meters and last updated date below the total.
- **AC-7.4:** The system shall calculate the predicted bill as the sum of per-meter predictions, where each prediction = predictedUsage × tariff.
- **AC-7.5:** The system shall display a bill breakdown section listing each meter's service name, predicted amount, and predicted usage with unit, plus a total row.
- **AC-7.6:** If no readings exist for a meter, the system shall exclude that meter from the prediction and show "Немає даних" next to its name in the breakdown.

---

#### US-8: Переглянути розумні підказки

**Як** Роман,
**я хочу** бачити аномалії витрати та поради з економії,
**щоб** вчасно виявити виток або знизити споживання.

**Приймальні критерії:**

- **AC-8.1:** The system shall display a "Розумні підказки" section on the Home page with an AI analytics label.
- **AC-8.2:** When the user has ≥3 consecutive months of readings, the system shall display a streak insight: "{N} місяців підряд" with a description about timely submissions.
- **AC-8.3:** If a meter's last month usage differs from the previous month by ≥15%, the system shall display an anomaly insight with the meter name, percentage change, and a description suggesting a possible leak or savings.
- **AC-8.4:** If an electricity meter exists, the system shall display a CO₂ insight showing monthly CO₂ in kg and tree-equivalent, using the formula: CO₂kg = monthlyUsage × 0.3.
- **AC-8.5:** The system shall display a savings tip insight about electricity night tariffs.
- **AC-8.6:** If a gas meter exists, the system shall display a seasonal pattern insight about gas usage increase in winter months.
- **AC-8.7:** Each insight shall have a colored icon, title, and description, with distinct colors per insight type (streak=orange, anomaly=red/green, CO₂=green, saving=amber, tip=teal).

---

### E4 — Нагадування

---

#### US-9: Отримувати нагадування про дедлайни

**Як** Роман,
**я хочу** отримувати нагадування про наближення дедлайну подачі,
**щоб** не пропустити вікно подачі.

**Приймальні критерії:**

- **AC-9.1:** The system shall display urgent deadline alerts on the Home page for meters with ≤3 days until the submission deadline, using an orange/red alert style with an alert circle icon.
- **AC-9.2:** The system shall display upcoming deadline reminders for meters with >3 days until the deadline, using a muted style with a bell icon.
- **AC-9.3:** The system shall schedule local notifications on the Android device at 3 days before, 1 day before, and on the day of each meter's submission deadline, at 09:00 local time.
- **AC-9.4:** Each notification shall contain the meter's service name and the deadline date, formatted as: "{serviceName} — передати показники до {date}".
- **AC-9.5:** The system shall allow the user to toggle each notification type (reading reminders, payment reminders, tariff changes, usage anomalies) in Settings.
- **AC-9.6:** When a notification toggle is turned off, the system shall cancel all scheduled notifications of that type.
- **AC-9.7:** When a notification toggle is turned on, the system shall schedule notifications for all upcoming deadlines of that type.

---

### E5 — Налаштування та профіль

---

#### US-10: Налаштувати EPS акаунт

**Як** Роман,
**я хочу** зберегти облікові дані eps.org.ua в додатку,
**щоб** автоматична подача працювала без ручного логіну.

**Приймальні критерії:**

- **AC-10.1:** The system shall display an "EPS Акаунт" section in Settings showing the account label "EPS Ternopil", account number, and connection status.
- **AC-10.2:** The system shall display a "Підключено" (green) badge when EPS credentials are stored, and a "Не підключено" (gray) badge when they are not.
- **AC-10.3:** When EPS credentials are not stored, the system shall display a "Налаштувати" button that opens a form to enter EPS username and password.
- **AC-10.4:** The system shall store EPS credentials securely on the device (not in plaintext, not in the cloud database).
- **AC-10.5:** The system shall display a link "Відкрити EPS" that opens eps.org.ua in the device browser (or InAppBrowser).
- **AC-10.6:** When the user saves EPS credentials, the system shall validate them by attempting a login to eps.org.ua and displaying success/failure feedback.

---

#### US-11: Переглянути інформацію про додаток

**Як** Роман,
**я хочу** бачити версію додатка та технічні деталі,
**щоб** знати, якою версією користуюся.

**Приймальні критерії:**

- **AC-11.1:** The system shall display a "Про додаток" section in Settings with the following fields: Version, OCR Engine, EPS Integration.
- **AC-11.2:** The system shall display the version in format "{major}.{minor}.{patch} ({stage})" — e.g., "0.1.0 (MVP)".
- **AC-11.3:** The version number shall be sourced from `package.json` version field, displayed in the Settings page and in the footer of the Settings page as "Communal v{version}".
- **AC-11.4:** The system shall display the OCR engine name (e.g., "Google ML Kit v2") and the EPS integration method (e.g., "WebView + JS").

---

### E6 — БД та API

---

#### US-12: Зберігати показники в базі даних

**Як** система,
**я хочу** зберігати показники в Neon PostgreSQL,
**щоб** мати надійну історію даних.

**Приймальні критерії:**

- **AC-12.1:** The system shall store readings in a `readings` table with columns: id (UUID), meter_id (FK), value (numeric), date (date), photo_url (text, nullable), ocr_confidence (real), ocr_engine (text), submitted_to_eps (boolean), submitted_at (timestamptz, nullable).
- **AC-12.2:** The system shall store meters in a `meters` table with columns matching the `Meter` TypeScript interface (id, meter_number, service_type, service_name, unit, last_reading, last_reading_date, submit_deadline_day, submit_window_start, color, color_light, icon).
- **AC-12.3:** The system shall store tariffs in a `tariffs` table with columns matching the `Tariff` TypeScript interface.
- **AC-12.4:** The system shall store user settings in a `settings` table (single-row, singleton pattern): eps_username, eps_account_number, notification_reading, notification_payment, notification_tariff, notification_anomaly, user_name, user_address.
- **AC-12.5:** The system shall provide Next.js API routes (or server actions) for: GET /api/meters, GET /api/readings?meterId=, POST /api/readings, GET /api/tariffs, GET /api/settings, PUT /api/settings.
- **AC-12.6:** When a new reading is stored, the system shall update the corresponding meter's last_reading and last_reading_date fields.
- **AC-12.7:** The system shall use the `@neondatabase/serverless` driver for all database connections via the Neon serverless driver.

---

#### US-13: Мігрувати з mock data на реальну БД

**Як** система,
**я хочу** замінити mock data на реальні API-виклики,
**щоб** дані зберігалися між сесіями.

**Приймальні критерії:**

- **AC-13.1:** The system shall replace all imports from `@/lib/mockData` with API calls to Next.js server actions or API routes.
- **AC-13.2:** The Home page shall fetch meters, reminders, bill predictions, and insights from the API on page load.
- **AC-13.3:** The Submit page shall persist readings via POST /api/readings after successful EPS submission.
- **AC-13.4:** The History page shall fetch readings for the selected meter from the API.
- **AC-13.5:** The Settings page shall fetch and update settings via the API.
- **AC-13.6:** While API data is loading, the system shall display a shimmer/skeleton loading state matching the layout of the loaded content.
- **AC-13.7:** If an API call fails, the system shall display an error state with a retry button, not a blank page.

---

### E7 — Android (Capacitor)

---

#### US-14: Запустити додаток на Android через Capacitor

**Як** Роман,
**я хочу** встановити додаток на Android-телефон,
**щоб** користуватися ним як нативним.

**Приймальні критерії:**

- **AC-14.1:** The system shall include a `capacitor.config.ts` file configured with: appId (e.g., "com.jagm.communal"), appName ("Communal"), webDir ("out" or Next.js static export directory).
- **AC-14.2:** The system shall build as a static export (Next.js `output: 'export'`) to be served by Capacitor's WebView.
- **AC-14.3:** The system shall use Capacitor HTTP plugin (or native bridge) for API calls when running inside Capacitor, since server-side API routes are not available in static export.
- **AC-14.4:** The Android app shall respect safe-area insets (notch, bottom navigation bar) using `env(safe-area-inset-*)` CSS.
- **AC-14.5:** The bottom navigation bar shall not overlap with the Android system navigation bar.
- **AC-14.6:** The app shall request camera permission on first use of the OCR feature, with a rationale dialog explaining why camera access is needed.
- **AC-14.7:** The app shall request notification permission on first launch, with a rationale explaining that notifications are for deadline reminders.

---

#### US-15: On-device OCR через Google ML Kit

**Як** система,
**я хочу** розпізнавати цифри лічильника локально на пристрої,
**щоб** фото не завантажувалося на сервер.

**Приймальні критерії:**

- **AC-15.1:** The system shall use a Capacitor plugin (or custom native plugin) that wraps Google ML Kit Text Recognition v2 for on-device OCR.
- **AC-15.2:** The OCR engine shall process the captured photo and return a numeric value and confidence score.
- **AC-15.3:** The OCR processing shall occur entirely on the device; no image data shall be transmitted to any server.
- **AC-15.4:** If the ML Kit plugin is not available (e.g., running in web browser without Capacitor), the system shall fall back to manual input with a message: "OCR недоступний. Введіть показник вручну."
- **AC-15.5:** The OCR engine identifier ("mlkit") and confidence score shall be stored with each reading record in the database.

---

## 4. Architecture Concerns

| ID | Концерн | Опис | Документ для архітектора |
|----|---------|------|--------------------------|
| AC-1 | **eps.org.ua інтеграція без API** | eps.org.ua не надає публічного API. Подача показників вимагає WebView + JS-ін'єкцію. Структура сторінки може змінюватися. | Архітектор повинен спроєктувати: (1) WebView session management, (2) JS injection strategy, (3) error detection when page structure changes, (4) credential storage on device. |
| AC-2 | **Static export vs API routes** | Capacitor вимагає static export (`output: 'export'`), але Next.js API routes не працюють у static export. Варіанти: (a) окремий сервер для API, (b) Capacitor HTTP plugin + прямі запити до Neon, (c) serverless functions на Vercel + CORS. | Архітектор повинен обрати патерн доступу до БД з Capacitor-клієнта. |
| AC-3 | **On-device OCR plugin** | Потрібен Capacitor plugin для Google ML Kit Text Recognition v2. Існуючі плагіни потребують дослідження (OQ-3). Може знадобитися custom native plugin. | Архітектор повинен дослідити та обрати plugin, або спроєктувати custom. |
| AC-4 | **Secure credential storage** | EPS credentials (username/password) повинні зберігатися на пристрої безпечно. Не в plaintext, не в БД. | Архітектор повинен обрати: Capacitor SecureStoragePlugin, Android Keystore, або інший механізм. |
| AC-5 | **Neon serverless connection** | `@neondatabase/serverless` використовує HTTP-based connections (не TCP). Працює з edge functions та serverless. Якщо API на Vercel — ок. Якщо прямі запити з Capacitor — потрібен connection string у клієнті (ризик безпеки). | Архітектор повинен визначити, чи безпечно відкривати Neon connection string в клієнті, чи потрібен proxy/API server. |
| AC-6 | **Local notifications scheduling** | Capacitor Local Notifications plugin для scheduled notifications. Потребує тестування на різних Android-версіях. | Архітектор повинен перевірити сумісність plugin з target Android SDK. |
| AC-7 | **Design System alignment** | DESIGN_SYSTEM.md визначає teal + terracotta палітру, але поточний код використовує blue-500/blue-600 (page.tsx, BottomNav.tsx, submit page). Потрібне приведення коду до DESIGN_SYSTEM.md. | Дивіться DESIGN_SYSTEM.md §2 (Color Palette) та §8 (Implementation Notes). |

---

## 5. Mobile UX Standards

### 5.1. Загальні принципи

| Принцип | Вимога |
|---------|--------|
| **Thumb-friendly** | Усі інтерактивні елементи в нижній половині екрана мають бути ≥44×44px (Material Design 3 minimum touch target). |
| **One-handed use** | Основні дії (capture, submit) — в нижній третині екрана. Навігація — bottom nav. |
| **Readable outdoors** | Контрастність ≥4.5:1 для всіх текстових елементів (WCAG AA). Мінімальний body text — 15px. |
| **Cyrillic-first** | Усі тексти українською. Числа — uk-UA locale (пробіл як роздільник тисяч, кома як десятковий). |
| **No horizontal scroll** | Усі сторінки — вертикальний скрол лише. Горизонтальний скрол дозволений лише для meter selector pills. |
| **Safe areas** | Контент не перекривається notch, status bar, або system navigation bar. Використовувати `env(safe-area-inset-*)`. |

### 5.2. Material Design 3 відповідність (Android)

| Елемент | MD3 компонент | Примітка |
|---------|---------------|----------|
| Bottom navigation | NavigationBar + centered FAB | DESIGN_SYSTEM.md §5 |
| Primary button | FilledButton (colorPrimary) | h-12, rounded-xl |
| Secondary button | FilledTonalButton (colorSecondaryContainer) | h-11, rounded-xl |
| Text input | OutlinedTextField | h-12, rounded-xl, focus ring |
| Cards | Card (elevated) | rounded-2xl, shadow-sm |
| Alert banner | Snackbar або Card (colorErrorContainer) | rounded-2xl |
| Charts | Recharts (web) / MPAndroidChart (native) | Бар-чарт, 160px висота |
| Toggle | Switch (MD3) | h-6, w-11 |

### 5.3. Анімації

| Анімація | Тривалість | Easing |
|----------|-----------|--------|
| Page fade-in | 400ms | ease-out |
| Slide-up (hero card) | 500ms | ease-out |
| Card hover (web only) | 200ms | ease |
| Button press (active:scale-95) | 100ms | ease |
| OCR loading spinner | infinite | linear |

### 5.4. Форматування

| Тип | Формат | Приклад |
|-----|--------|---------|
| Валюта | `{N} ₴`, uk-UA, 2 десяткових | `2 398,52 ₴` |
| Показник (електро) | uk-UA, ціле | `12 453` |
| Показник (вода/газ) | 2 десяткових | `182,34` |
| Дата (коротка) | uk-UA, day + month | `5 серпня` |
| Дата (день тижня) | uk-UA, weekday + day + month | `п'ятниця, 22 серпня` |
| Відсоток | ціле + `%` | `15%` |

---

## 6. Version Display Location

| Локація | Формат | Джерело |
|---------|--------|---------|
| Settings → "Про додаток" → "Версія" | `{major}.{minor}.{patch} ({stage})` | `package.json` version field |
| Settings page footer | `Communal v{version} • Зроблено з ❤️ для України` | `package.json` version field |

**Реалізація:** Версія читається з `package.json` при збірці. У static export (Capacitor) — вбудовується як константа при build time. Не вимагає API-виклику.

---

## 7. Out of Scope

| ID | Елемент | Причина |
|----|---------|---------|
| OOS-1 | Публічна реєстрація користувачів | Персональний додаток, 1 користувач |
| OOS-2 | Multi-tenant архітектура | 1 користувач |
| OOS-3 | Оплата комуналки через додаток | Власник використовує е-Тернопіль / iPay.ua |
| OOS-4 | Інтеграція з іншими містами | Тільки Тернопіль, eps.org.ua |
| OOS-5 | Google Play Store реліз | Персональний додаток, sideload APK |
| OOS-6 | Server-side push notifications | Тільки локальні scheduled notifications |
| OOS-7 | OCR для стрілочних лічильників | Власник має цифрові лічильники |
| OOS-8 | Dark mode | DESIGN_SYSTEM.md явно виключає |
| OOS-9 | Річна аналітика | Потребує 6+ місяців даних (placeholder в UI) |
| OOS-10 | iOS-версія | Власник використовує Android |
| OOS-11 | Multi-language | Тільки українська |
| OOS-12 | PWA / offline mode | Потребує постійного інтернету для EPS подачі та БД |

---

## 8. Open Questions

| ID | Питання | Впливає на | Для кого | Статус |
|----|---------|------------|----------|--------|
| OQ-1 | Чи актуальні дедлайни подачі (31-ше для води, 3-тє для електро, 5-те для газу) на eps.org.ua? | US-9 (нагадування), AC-9.3 | Власник | Open |
| OQ-2 | Чи актуальні тарифи (35.20 ₴/м³ вода, 4.32 ₴/кВт·год електро, 7.99+13.87 ₴/м³ газ)? | US-7 (прогноз), US-6 (вартість) | Власник | Open |
| OQ-3 | Який Capacitor plugin використати для on-device OCR? (@capacitor-community/ml-kit? Custom plugin?) | US-15, AC-15.1 | Архітектор | Open |
| OQ-4 | Чи зберігає eps.org.ua сесію в cookies? Якщо так — скільки живе сесія? | US-4, AC-4.2 (WebView auth) | Архітектор | Open |
| OQ-5 | Яка модель газового лічильника? (Впливає на точність OCR) | US-15, AC-15.2 | Власник | Open |
| OQ-6 | Як Next.js static export взаємодіє з БД? (Прямі запити до Neon vs API server vs Vercel serverless) | US-12, US-13, AC-2 | Архітектор | Open |
| OQ-7 | Чи потрібен окремий API сервер, чи використовувати Vercel serverless functions поряд зі static export для Capacitor? | US-12, US-13, AC-2 | Архітектор | Open |
| OQ-8 | Чи зберігає eps.org.ua історію поданих показників, чи потрібна власна БД для історії? | US-5 (історія) | Власник | Open |

---

## 9. Залежності

| Залежність | Тип | Статус | Впливає на |
|------------|-----|--------|------------|
| Neon PostgreSQL | БД | Активний (план) | US-12, US-13 |
| @neondatabase/serverless | npm package | Встановлено (package.json) | US-12 |
| Capacitor | Framework | Не встановлено | US-14, US-15 |
| Capacitor Local Notifications plugin | Plugin | Не досліджено | US-9 |
| Google ML Kit Text Recognition v2 | OCR | Не інтегровано | US-15 |
| eps.org.ua WebView | Інтеграція | Не реалізовано | US-4 |
| DESIGN_SYSTEM.md | Документація | Готовий (32KB) | Усі UI stories |
| Next.js 16 static export | Build config | Не налаштовано | US-14 |

---

## 10. Non-Functional Requirements

| ID | Вимога | Метрика |
|----|--------|---------|
| NFR-1 | OCR latency | <3 сек від фото до результату на mid-range Android |
| NFR-2 | EPS submission latency | <10 сек від тапу до підтвердження |
| NFR-3 | Page load (Home) | <2 сек на 4G |
| NFR-4 | App startup | <1.5 сек до інтерактивного стану |
| NFR-5 | Data persistence | Усі показники зберігаються в Neon PostgreSQL, не втрачаються між сесіями |
| NFR-6 | Privacy | Фото лічильників не покидає пристрій. На сервер передаються лише цифри |
| NFR-7 | Accessibility | WCAG AA: контраст ≥4.5:1, touch targets ≥44×44px, keyboard navigation, screen reader support |
| NFR-8 | Localization | Усі тексти українською. Числа — uk-UA locale. Дати — українські назви |

---

## Provenance

| Джерело | Тип | Дата доступу |
|---------|-----|-------------|
| `F:\communal\src\lib\types.ts` | Код | 2026-08-22 |
| `F:\communal\src\lib\mockData.ts` | Код | 2026-08-22 |
| `F:\communal\DESIGN_SYSTEM.md` | Документація | 2026-08-22 |
| `F:\communal\src\app\page.tsx` | Код | 2026-08-22 |
| `F:\communal\src\app\submit\page.tsx` | Код | 2026-08-22 |
| `F:\communal\src\app\history\page.tsx` | Код | 2026-08-22 |
| `F:\communal\src\app\settings\page.tsx` | Код | 2026-08-22 |
| `F:\communal\src\app\layout.tsx` | Код | 2026-08-22 |
| `F:\communal\src\components\MeterCard.tsx` | Код | 2026-08-22 |
| `F:\communal\src\components\BottomNav.tsx` | Код | 2026-08-22 |
| `F:\communal\src\components\DeadlineAlert.tsx` | Код | 2026-08-22 |
| `F:\communal\src\components\SmartInsights.tsx` | Код | 2026-08-22 |
| `F:\communal\src\components\BillExplanation.tsx` | Код | 2026-08-22 |
| `F:\communal\src\components\UsageChart.tsx` | Код | 2026-08-22 |
| `F:\communal\package.json` | Код | 2026-08-22 |
| `F:\communal\wiki\index.md` | Документація | 2026-08-22 |
| [Business Brief](../business/2026-08-22-communal-brief.md) | Документ | 2026-08-22 |
| eps.org.ua (веб-сайт) | Дослідження | 2026-08-22 |
| ternopilcity.gov.ua | Дослідження | 2026-08-22 |

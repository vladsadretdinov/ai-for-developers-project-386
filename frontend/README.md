# Booking Calendar — фронтенд

UI сервиса бронирования слотов (упрощённый Calendly). Реализован как **отдельная
часть приложения** и общается с бэкендом **только через API по контракту**
(`../tsp-output/openapi.yaml`).

## Стек

- **Angular 22** (standalone-компоненты, signals, zoneless) + Vite/esbuild dev-сервер
- **TypeScript**
- **Tailwind CSS v4** + компоненты в стиле **shadcn/ui** (`src/app/ui/*`)
- **Prism** — мок API по контракту для локальной разработки
- Типы API сгенерированы из OpenAPI через `openapi-typescript`
  (`src/app/api/schema.d.ts`)

## Структура

```
src/app/
  api/            # типы из контракта + HTTP-сервисы (public + admin)
  core/           # cn(), конфиг базового URL, парсинг ошибок, date utils
  ui/             # shadcn-style примитивы (button, card, input, badge, spinner)
  components/     # month-calendar (календарь в стиле Cal.com)
  pages/
    guest/        # список типов событий + страница бронирования
    admin/        # панель владельца: типы событий (CRUD), встречи, отмена
```

## Страницы

Гость (`/public/*`):
- `/` — список типов встреч (`GET /public/event-types`)
- `/book/:eventTypeId` — выбор дня и слота на 14 дней
  (`GET /public/event-types/{id}/slots`) и бронирование (`POST /public/bookings`).
  Обрабатываются ответы `201/404/409/422`.

Владелец (`/admin/*`):
- `/admin/bookings` — список встреч с фильтром по статусу, отмена
  (`GET /admin/bookings`, `DELETE /admin/bookings/{id}`)
- `/admin/bookings/:id` — детали встречи
- `/admin/event-types` — создание/редактирование/удаление типов событий
  (`GET/POST/PUT/DELETE /admin/event-types`)

## Запуск

```bash
npm install

# 1) поднять мок-бэкенд по контракту (Prism, порт 4010)
npm run mock

# 2) в другом терминале — dev-сервер фронтенда (порт 4200)
npm start
```

Или одной командой (мок + фронтенд параллельно):

```bash
npm run dev
```

Откройте http://localhost:4200.

## Подключение к настоящему бэкенду

Dev-сервер проксирует `/api` → `http://localhost:4010` (см. `proxy.conf.json`).
Чтобы указать другой бэкенд, измените цель в `proxy.conf.json` или переопределите
провайдер `API_BASE_URL` (`src/app/core/api.config.ts`).

## Прочее

```bash
npm run build          # production-сборка
npm run generate:api   # перегенерировать типы из ../tsp-output/openapi.yaml
```

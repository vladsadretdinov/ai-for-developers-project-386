# Booking Calendar — бэкенд

Реализация серверной части по контракту из `tsp-output/openapi.yaml`.

## Технологии

- **Go** (стандартная библиотека `net/http`, маршрутизация через `ServeMux`
  с шаблонами методов и путей из Go 1.22).
- Хранилище — **in-memory** (`internal/store`). Отдельная БД не нужна:
  после перезапуска данные сбрасываются. При старте создаётся предзаданный
  владелец и пара демонстрационных типов событий.

## Структура

```
backend/
  cmd/server/main.go        — точка входа, запуск HTTP-сервера
  internal/model            — доменные модели контракта
  internal/store            — in-memory хранилище + бизнес-правила
  internal/httpapi          — роутер, обработчики, валидация, ошибки
```

## Запуск

```bash
cd backend
go run ./cmd/server      # слушает :3001 (переопределяется переменной PORT)
```

Проверка:

```bash
curl http://localhost:3001/public/event-types
```

## Тесты

```bash
cd backend
go test ./...
```

## Реализованные бизнес-правила

1. **Уникальность времени** — на пересекающийся интервал нельзя создать вторую
   подтверждённую бронь, даже для другого типа события → `409 slot_taken`.
2. **Окно записи 14 дней** — слоты формируются на 14 дней от текущего момента;
   бронь вне окна → `409 slot_taken`.
3. **Только свободный слот** — время старта должно совпадать с узлом сетки слотов
   (рабочие часы 09:00–17:00 по таймзоне владельца, шаг = длительность типа).
   Занятые слоты исчезают из выдачи `GET /public/event-types/{id}/slots`.

## Соответствие контракту

| Метод и путь                                   | Роль   |
|------------------------------------------------|--------|
| `GET /admin/owner`                             | Owner  |
| `GET/POST /admin/event-types`                  | Owner  |
| `GET/PUT/DELETE /admin/event-types/{id}`       | Owner  |
| `GET /admin/bookings`                          | Owner  |
| `GET/DELETE /admin/bookings/{bookingId}`       | Owner  |
| `GET /public/event-types`                      | Guest  |
| `GET /public/event-types/{id}`                 | Guest  |
| `GET /public/event-types/{id}/slots`           | Guest  |
| `POST /public/bookings`                        | Guest  |

Коды ответов: `200/201/204/404/409/422` согласно спецификации.

> Фронтенд (`/frontend`) в dev-режиме проксирует `/api` на бэкенд
> (см. `frontend/proxy.conf.json`).

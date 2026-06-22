# Инструкции для ИИ-агентов

Этот файл задаёт правила для агентов (OpenCode и совместимых), работающих с
репозиторием.

## Коммиты — строго Conventional Commits

Любой коммит, который создаёт агент, ОБЯЗАН следовать спецификации
[Conventional Commits](https://www.conventionalcommits.org/). Это нужно для
корректной работы release-please (автоматический changelog и версия).

Формат: `<type>(<scope>): <описание>`

- Разрешённые типы: `feat`, `fix`, `perf`, `refactor`, `test`, `docs`,
  `build`, `ci`, `chore`, `revert`.
- `feat` → minor, `fix`/`perf` → patch. Ломающее изменение — `!` или футер
  `BREAKING CHANGE:` → major.
- Описание в повелительном наклонении, с маленькой буквы, без точки в конце.
- Рекомендуемые scope: `frontend`, `backend`, `e2e`, `spec`, `guest`, `admin`, `ci`.

Примеры: `feat(admin): добавить фильтр встреч по статусу`,
`fix(backend): чинить расчёт сетки слотов`, `test(e2e): добавить проверку валидации формы`.

Подробности — в [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Структура проекта

- `backend/` — Go API (in-memory store), порт `:3001`.
- `frontend/` — Angular 22, dev-сервер `:4200`, проксирует `/api` → бэкенд.
- `e2e/` — Playwright + TypeScript, интеграционные сценарии бронирования.
- `spec/` — TypeSpec-контракт, сборка в `tsp-output/openapi.yaml`.

## Проверки перед коммитом

- Бэкенд: `cd backend && go test ./...`
- e2e: `cd e2e && npm test` (Playwright сам поднимает бэкенд и фронтенд).

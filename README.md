### Hexlet tests and linter status:
[![Actions Status](https://github.com/vladsadretdinov/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/vladsadretdinov/ai-for-developers-project-386/actions)

# Booking Calendar — API-контракт

Сервис бронирования слотов (упрощённый Calendly). Без регистрации и авторизации:
один предзаданный владелец календаря + анонимные гости.

## Структура

- `docs/domain.md` — доменные сущности и сценарии (владелец, тип события, слот, бронирование, гость).
- `docs/coverage.md` — проверка покрытия сценариев владельца и гостя.
- `spec/` — TypeSpec-спецификация API:
  - `models.tsp` — доменные модели и ошибки;
  - `owner.tsp` — операции владельца (`/admin/*`);
  - `guest.tsp` — публичные операции гостя (`/public/*`);
  - `main.tsp` — service/server и сборка спеки.
- `tsp-output/openapi.yaml` — сгенерированный OpenAPI 3 (после сборки).

## Сборка

```bash
npm install
npm run build   # tsp compile spec -> tsp-output/openapi.yaml
```
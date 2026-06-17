import { HttpErrorResponse } from '@angular/common/http';

/**
 * Translate an HTTP error into a human-readable message, using the error
 * envelopes defined by the contract (NotFoundError / SlotTakenError /
 * ValidationError — all share `{ code, message }`).
 */
export function describeApiError(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error as { code?: string; message?: string } | null;
    if (body?.message) {
      return body.message;
    }
    switch (err.status) {
      case 0:
        return 'Не удалось связаться с сервером. Запущен ли бэкенд?';
      case 404:
        return 'Ресурс не найден.';
      case 409:
        return 'Это время уже занято. Выберите другой слот.';
      case 422:
        return 'Некорректные данные. Проверьте поля формы.';
      default:
        return `Ошибка запроса (${err.status}).`;
    }
  }
  return 'Неизвестная ошибка.';
}

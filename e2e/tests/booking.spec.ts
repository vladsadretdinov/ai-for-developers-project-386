import { test, expect, type Page } from '@playwright/test';

/**
 * Интеграционные сценарии бронирования (фронт + реальный бэкенд).
 * См. docs/e2e-scenarios.md.
 */

/** Выбирает в календаре первый день, у которого есть свободные слоты. */
async function selectFirstDayWithSlots(page: Page): Promise<void> {
  // Кнопки-дни в календаре — без aria-label (в отличие от навигации по месяцам).
  const dayButtons = page.locator(
    'app-month-calendar button:not([disabled]):not([aria-label])',
  );
  await expect(dayButtons.first()).toBeVisible();

  const count = await dayButtons.count();
  for (let i = 0; i < count; i++) {
    await dayButtons.nth(i).click();
    // Если у дня есть слоты — появятся кнопки со временем.
    const slot = page.getByRole('button', { name: /^\d{1,2}:\d{2}$/ }).first();
    if (await slot.isVisible().catch(() => false)) {
      return;
    }
  }
  throw new Error('Не найдено ни одного дня со свободными слотами');
}

test.describe('Бронирование слота', () => {
  test('основной сценарий: гость бронирует встречу от начала до конца', async ({
    page,
  }) => {
    // 1. Список типов встреч.
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Выберите тип встречи' }),
    ).toBeVisible();

    // 2. Переход к бронированию.
    const bookLink = page.getByRole('link', { name: 'Записаться' }).first();
    await expect(bookLink).toBeVisible();
    await bookLink.click();

    await expect(page).toHaveURL(/\/book\//);

    // 3-5. Выбор дня и слота.
    await selectFirstDayWithSlots(page);
    const slot = page.getByRole('button', { name: /^\d{1,2}:\d{2}$/ }).first();
    const slotTime = (await slot.textContent())?.trim() ?? '';
    await slot.click();

    // 6. Форма бронирования.
    await expect(page.getByLabel('Имя *')).toBeVisible();
    await page.getByLabel('Имя *').fill('Иван Тестов');
    await page.getByLabel('Email *').fill('ivan.test@example.com');

    // 7. Подтверждение.
    await page.getByRole('button', { name: 'Подтвердить' }).click();

    // 8. Экран успеха.
    await expect(
      page.getByRole('heading', { name: 'Встреча забронирована' }),
    ).toBeVisible();
    await expect(page.getByText('Иван Тестов')).toBeVisible();
    await expect(page.getByText('ivan.test@example.com')).toBeVisible();
    expect(slotTime).toMatch(/^\d{1,2}:\d{2}$/);
  });

  test('валидация: нельзя подтвердить без имени и email', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Записаться' }).first().click();
    await expect(page).toHaveURL(/\/book\//);

    await selectFirstDayWithSlots(page);
    await page.getByRole('button', { name: /^\d{1,2}:\d{2}$/ }).first().click();

    await expect(page.getByLabel('Имя *')).toBeVisible();
    await page.getByRole('button', { name: 'Подтвердить' }).click();

    await expect(page.getByText('Заполните имя и email.')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Встреча забронирована' }),
    ).toHaveCount(0);
  });

  test('конфликт: забронированный слот исчезает из доступных', async ({
    page,
  }) => {
    // Первый гость бронирует слот.
    await page.goto('/');
    await page.getByRole('link', { name: 'Записаться' }).first().click();
    await expect(page).toHaveURL(/\/book\//);
    const bookingUrl = page.url();

    await selectFirstDayWithSlots(page);
    const firstSlot = page
      .getByRole('button', { name: /^\d{1,2}:\d{2}$/ })
      .first();
    const takenTime = (await firstSlot.textContent())?.trim() ?? '';
    await firstSlot.click();

    await page.getByLabel('Имя *').fill('Первый Гость');
    await page.getByLabel('Email *').fill('first@example.com');
    await page.getByRole('button', { name: 'Подтвердить' }).click();
    await expect(
      page.getByRole('heading', { name: 'Встреча забронирована' }),
    ).toBeVisible();

    // Второй гость открывает тот же тип события заново.
    await page.goto(bookingUrl);
    await selectFirstDayWithSlots(page);

    // Занятое время больше не предлагается среди слотов того же дня.
    await expect(
      page.getByRole('button', { name: takenTime, exact: true }),
    ).toHaveCount(0);
  });

  test('навигация: возврат к списку типов встреч', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Записаться' }).first().click();
    await expect(page).toHaveURL(/\/book\//);

    await page.getByRole('link', { name: /Все типы встреч/ }).click();
    await expect(
      page.getByRole('heading', { name: 'Выберите тип встречи' }),
    ).toBeVisible();
  });
});

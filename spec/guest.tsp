import "@typespec/http";
import "@typespec/rest";

using Http;
using Rest;

namespace BookingCalendar;

/**
 * Публичная часть для гостя.
 *
 * Полностью анонимна: без регистрации и входа. Гость смотрит список видов
 * брони, открывает календарь свободных слотов на ближайшие 14 дней и создаёт
 * бронирование на выбранный слот.
 */
@route("/public")
@tag("Guest")
namespace Public {
  /** Виды брони, доступные гостю. */
  @route("/event-types")
  namespace EventTypes {
    /**
     * Страница с видами брони.
     * Для каждого вида доступны название, описание и длительность.
     */
    @get
    @summary("Список видов брони")
    op list(): EventType[];

    @get
    @summary("Получить вид брони по id")
    op read(@path eventTypeId: string): EventType | NotFoundError;

    /**
     * Календарь свободных слотов выбранного типа события.
     *
     * Слоты формируются на 14 дней начиная с текущей даты. Слот, на время
     * которого уже есть бронирование (любого типа события), в список не попадает.
     */
    @route("/{eventTypeId}/slots")
    @get
    @summary("Свободные слоты типа события на ближайшие 14 дней")
    op listSlots(
      @path eventTypeId: string,

      @doc("Начало окна. По умолчанию — текущая дата. Не может быть в прошлом.")
      @query
      from?: utcDateTime,
    ): SlotList | NotFoundError;
  }

  /**
   * Создание бронирования на выбранный слот.
   *
   * Ошибки:
   *  - 404 — указанный тип события не существует;
   *  - 409 — выбранное время уже занято другим бронированием
   *          (в т.ч. другого типа события) или слот вне окна 14 дней;
   *  - 422 — некорректные данные гостя или формат запроса.
   */
  @route("/bookings")
  @post
  @summary("Создать бронирование на выбранный слот")
  op createBooking(@body body: BookingCreate):
    | {
        @statusCode statusCode: 201;
        @body created: Booking;
      }
    | NotFoundError
    | SlotTakenError
    | ValidationError;
}

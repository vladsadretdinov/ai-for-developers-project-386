import "@typespec/http";
import "@typespec/rest";

using Http;
using Rest;

namespace BookingCalendar;

/**
 * Админская часть владельца календаря.
 *
 * Авторизации нет: считаем, что эти эндпоинты обслуживают единственный
 * предзаданный профиль владельца. Здесь владелец управляет типами событий
 * и просматривает все предстоящие встречи.
 */
@route("/admin")
@tag("Owner")
namespace Admin {
  /** Профиль владельца календаря (только чтение). */
  @route("/owner")
  @get
  @summary("Получить профиль владельца")
  op getOwner(): Owner;

  /** Типы событий, которыми управляет владелец. */
  @route("/event-types")
  namespace EventTypes {
    @get
    @summary("Список типов событий")
    op list(): EventType[];

    @post
    @summary("Создать тип события")
    op create(@body body: EventTypeCreate):
      | {
          @statusCode statusCode: 201;
          @body created: EventType;
        }
      | ValidationError;

    @get
    @summary("Получить тип события по id")
    op read(@path eventTypeId: string): EventType | NotFoundError;

    @put
    @summary("Обновить тип события")
    op update(@path eventTypeId: string, @body body: EventTypeCreate):
      | EventType
      | NotFoundError
      | ValidationError;

    @delete
    @summary("Удалить тип события")
    op delete(@path eventTypeId: string):
      | {
          @statusCode statusCode: 204;
        }
      | NotFoundError;
  }

  /**
   * Страница предстоящих встреч.
   *
   * Возвращает бронирования всех типов событий в одном списке,
   * отсортированные по времени начала.
   */
  @route("/bookings")
  @get
  @summary("Список предстоящих встреч (все типы событий)")
  op listBookings(
    @doc("Показывать встречи начиная с этого момента. По умолчанию — текущее время.")
    @query
    from?: utcDateTime,

    @doc("Показывать встречи до этого момента.")
    @query
    to?: utcDateTime,

    @doc("Фильтр по статусу. По умолчанию возвращаются только confirmed.")
    @query
    status?: BookingStatus,
  ): Booking[];

  /** Детали конкретного бронирования. */
  @route("/bookings/{bookingId}")
  @get
  @summary("Получить бронирование по id")
  op getBooking(@path bookingId: string): Booking | NotFoundError;

  /** Отмена бронирования владельцем. */
  @route("/bookings/{bookingId}")
  @delete
  @summary("Отменить бронирование")
  op cancelBooking(@path bookingId: string): Booking | NotFoundError;
}

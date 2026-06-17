package store

import (
	"errors"
	"testing"
	"time"

	"booking-calendar/backend/internal/model"
)

// nextFreeSlot возвращает первый свободный слот первого типа события.
func nextFreeSlot(t *testing.T, s *Store) (model.EventType, time.Time) {
	t.Helper()
	ets := s.ListEventTypes()
	if len(ets) == 0 {
		t.Fatal("ожидались предзаданные типы событий")
	}
	et := ets[0]
	now := time.Now()
	list, err := s.ListSlots(et.ID, now, now)
	if err != nil {
		t.Fatalf("ListSlots: %v", err)
	}
	if len(list.Slots) == 0 {
		t.Fatal("ожидался хотя бы один свободный слот")
	}
	return et, list.Slots[0].Start
}

func TestCreateBookingSuccess(t *testing.T) {
	s := New()
	et, start := nextFreeSlot(t, s)

	b, err := s.CreateBooking(model.BookingCreate{
		EventTypeID: et.ID,
		Start:       start,
		GuestName:   "Гость",
		GuestEmail:  "guest@example.com",
	}, time.Now())
	if err != nil {
		t.Fatalf("неожиданная ошибка: %v", err)
	}
	if b.Status != model.StatusConfirmed {
		t.Fatalf("ожидался статус confirmed, получили %s", b.Status)
	}
	if !b.End.Equal(start.Add(time.Duration(et.DurationMinutes) * time.Minute)) {
		t.Fatal("end должен вычисляться из длительности типа события")
	}
}

func TestSlotTakenAcrossEventTypes(t *testing.T) {
	s := New()
	ets := s.ListEventTypes()
	et1, et2 := ets[0], ets[1]

	now := time.Now()
	list, _ := s.ListSlots(et1.ID, now, now)
	start := list.Slots[0].Start

	if _, err := s.CreateBooking(model.BookingCreate{
		EventTypeID: et1.ID, Start: start, GuestName: "A", GuestEmail: "a@x.io",
	}, now); err != nil {
		t.Fatalf("первая бронь должна создаться: %v", err)
	}

	// Бронь другого типа на пересекающееся время должна вернуть slot_taken.
	_, err := s.CreateBooking(model.BookingCreate{
		EventTypeID: et2.ID, Start: start, GuestName: "B", GuestEmail: "b@x.io",
	}, now)
	if !errors.Is(err, ErrSlotTaken) {
		t.Fatalf("ожидался ErrSlotTaken, получили %v", err)
	}
}

func TestBookedSlotDisappearsFromList(t *testing.T) {
	s := New()
	et, start := nextFreeSlot(t, s)
	now := time.Now()

	if _, err := s.CreateBooking(model.BookingCreate{
		EventTypeID: et.ID, Start: start, GuestName: "A", GuestEmail: "a@x.io",
	}, now); err != nil {
		t.Fatal(err)
	}

	list, _ := s.ListSlots(et.ID, now, now)
	for _, sl := range list.Slots {
		if sl.Start.Equal(start) {
			t.Fatal("занятый слот не должен присутствовать в списке свободных")
		}
	}
}

func TestBookingUnknownEventType(t *testing.T) {
	s := New()
	_, err := s.CreateBooking(model.BookingCreate{
		EventTypeID: "missing", Start: time.Now().Add(48 * time.Hour),
		GuestName: "A", GuestEmail: "a@x.io",
	}, time.Now())
	if !errors.Is(err, ErrNotFound) {
		t.Fatalf("ожидался ErrNotFound, получили %v", err)
	}
}

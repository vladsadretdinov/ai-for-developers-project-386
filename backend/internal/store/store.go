// Package store реализует in-memory хранилище и основные бизнес-правила
// бронирования. После перезапуска сервиса данные сбрасываются.
package store

import (
	"errors"
	"fmt"
	"sort"
	"sync"
	"time"

	"booking-calendar/backend/internal/model"
)

// Доменные ошибки бизнес-правил. HTTP-слой переводит их в коды ответа.
var (
	ErrNotFound  = errors.New("not_found")
	ErrSlotTaken = errors.New("slot_taken")
)

// Параметры формирования слотов. Контракт фиксирует только окно в 14 дней,
// часы работы — разумное доменное допущение для генерации сетки слотов.
const (
	windowDays   = 14
	workdayStart = 9  // 09:00 по таймзоне владельца
	workdayEnd   = 17 // 17:00 по таймзоне владельца (последний слот должен завершиться до этого часа)
)

// Store хранит данные сервиса в памяти и обеспечивает потокобезопасный доступ.
type Store struct {
	mu         sync.RWMutex
	owner      model.Owner
	loc        *time.Location
	eventTypes map[string]model.EventType
	bookings   map[string]model.Booking
	seq        int
}

// New создаёт хранилище с предзаданным владельцем и демонстрационными данными.
func New() *Store {
	loc, err := time.LoadLocation("Europe/Moscow")
	if err != nil {
		loc = time.UTC
	}
	s := &Store{
		owner: model.Owner{
			ID:       "owner-1",
			Name:     "Календарь владельца",
			Email:    "owner@example.com",
			TimeZone: "Europe/Moscow",
		},
		loc:        loc,
		eventTypes: make(map[string]model.EventType),
		bookings:   make(map[string]model.Booking),
	}
	s.seed()
	return s
}

func (s *Store) seed() {
	for _, et := range []model.EventTypeCreate{
		{Title: "Демо продукта", Description: "Знакомство с продуктом и ответы на вопросы.", DurationMinutes: 30},
		{Title: "Консультация", Description: "Индивидуальная консультация по проекту.", DurationMinutes: 60},
	} {
		_, _ = s.CreateEventType(et)
	}
}

func (s *Store) nextID(prefix string) string {
	s.seq++
	return fmt.Sprintf("%s-%d", prefix, s.seq)
}

// Owner возвращает профиль владельца.
func (s *Store) Owner() model.Owner {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.owner
}

// --- EventType ---

// ListEventTypes возвращает все типы событий, отсортированные по id.
func (s *Store) ListEventTypes() []model.EventType {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]model.EventType, 0, len(s.eventTypes))
	for _, et := range s.eventTypes {
		out = append(out, et)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// GetEventType возвращает тип события или ErrNotFound.
func (s *Store) GetEventType(id string) (model.EventType, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	et, ok := s.eventTypes[id]
	if !ok {
		return model.EventType{}, ErrNotFound
	}
	return et, nil
}

// CreateEventType создаёт новый тип события.
func (s *Store) CreateEventType(in model.EventTypeCreate) (model.EventType, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	et := model.EventType{
		ID:              s.nextID("et"),
		Title:           in.Title,
		Description:     in.Description,
		DurationMinutes: in.DurationMinutes,
	}
	s.eventTypes[et.ID] = et
	return et, nil
}

// UpdateEventType обновляет тип события или возвращает ErrNotFound.
func (s *Store) UpdateEventType(id string, in model.EventTypeCreate) (model.EventType, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	et, ok := s.eventTypes[id]
	if !ok {
		return model.EventType{}, ErrNotFound
	}
	et.Title = in.Title
	et.Description = in.Description
	et.DurationMinutes = in.DurationMinutes
	s.eventTypes[id] = et
	return et, nil
}

// DeleteEventType удаляет тип события или возвращает ErrNotFound.
func (s *Store) DeleteEventType(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.eventTypes[id]; !ok {
		return ErrNotFound
	}
	delete(s.eventTypes, id)
	return nil
}

// --- Bookings ---

// ListBookings возвращает бронирования в интервале [from, to] с фильтром статуса,
// отсортированные по времени начала.
func (s *Store) ListBookings(from, to *time.Time, status model.BookingStatus) []model.Booking {
	s.mu.RLock()
	defer s.mu.RUnlock()
	out := make([]model.Booking, 0, len(s.bookings))
	for _, b := range s.bookings {
		if status != "" && b.Status != status {
			continue
		}
		if from != nil && b.Start.Before(*from) {
			continue
		}
		if to != nil && b.Start.After(*to) {
			continue
		}
		out = append(out, b)
	}
	sort.Slice(out, func(i, j int) bool { return out[i].Start.Before(out[j].Start) })
	return out
}

// GetBooking возвращает бронирование или ErrNotFound.
func (s *Store) GetBooking(id string) (model.Booking, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	b, ok := s.bookings[id]
	if !ok {
		return model.Booking{}, ErrNotFound
	}
	return b, nil
}

// CancelBooking переводит бронирование в статус cancelled.
func (s *Store) CancelBooking(id string) (model.Booking, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, ok := s.bookings[id]
	if !ok {
		return model.Booking{}, ErrNotFound
	}
	b.Status = model.StatusCancelled
	s.bookings[id] = b
	return b, nil
}

// CreateBooking создаёт бронирование с проверкой бизнес-правил:
//   - тип события должен существовать (ErrNotFound);
//   - время старта должно попадать в окно 14 дней и быть валидным слотом;
//   - на пересекающееся время не должно быть подтверждённых броней (ErrSlotTaken).
func (s *Store) CreateBooking(in model.BookingCreate, now time.Time) (model.Booking, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	et, ok := s.eventTypes[in.EventTypeID]
	if !ok {
		return model.Booking{}, ErrNotFound
	}

	start := in.Start.UTC()
	end := start.Add(time.Duration(et.DurationMinutes) * time.Minute)

	windowStart, windowEnd := s.windowLocked(now)
	if start.Before(windowStart) || end.After(windowEnd) {
		return model.Booking{}, ErrSlotTaken
	}
	if !s.isValidSlotStartLocked(et, start) {
		return model.Booking{}, ErrSlotTaken
	}

	// Главный инвариант: любое пересечение с подтверждённой бронью (любого типа) запрещено.
	if s.overlapsLocked(start, end, "") {
		return model.Booking{}, ErrSlotTaken
	}

	b := model.Booking{
		ID:          s.nextID("bk"),
		EventTypeID: et.ID,
		Start:       start,
		End:         end,
		GuestName:   in.GuestName,
		GuestEmail:  in.GuestEmail,
		Notes:       in.Notes,
		Status:      model.StatusConfirmed,
		CreatedAt:   now.UTC(),
	}
	s.bookings[b.ID] = b
	return b, nil
}

// --- Slots ---

// ListSlots вычисляет свободные слоты типа события в окне 14 дней.
func (s *Store) ListSlots(eventTypeID string, from time.Time, now time.Time) (model.SlotList, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	et, ok := s.eventTypes[eventTypeID]
	if !ok {
		return model.SlotList{}, ErrNotFound
	}

	windowStart := from.UTC()
	if windowStart.Before(now.UTC()) {
		windowStart = now.UTC()
	}
	windowEnd := s.windowEndLocked(now)

	slots := make([]model.Slot, 0)
	dur := time.Duration(et.DurationMinutes) * time.Minute

	for _, candidate := range s.gridLocked(et, windowStart, windowEnd) {
		end := candidate.Add(dur)
		if candidate.Before(windowStart) || end.After(windowEnd) {
			continue
		}
		if s.overlapsLocked(candidate, end, "") {
			continue
		}
		slots = append(slots, model.Slot{Start: candidate, End: end})
	}

	return model.SlotList{
		EventTypeID: et.ID,
		WindowStart: windowStart,
		WindowEnd:   windowEnd,
		Slots:       slots,
	}, nil
}

// --- helpers (вызываются под удержанным mutex) ---

func (s *Store) windowLocked(now time.Time) (time.Time, time.Time) {
	return now.UTC(), s.windowEndLocked(now)
}

func (s *Store) windowEndLocked(now time.Time) time.Time {
	return now.UTC().AddDate(0, 0, windowDays)
}

// gridLocked генерирует сетку возможных начал слотов в рабочие часы владельца,
// с шагом в длительность типа события.
func (s *Store) gridLocked(et model.EventType, windowStart, windowEnd time.Time) []time.Time {
	var grid []time.Time
	step := time.Duration(et.DurationMinutes) * time.Minute

	day := windowStart.In(s.loc)
	day = time.Date(day.Year(), day.Month(), day.Day(), workdayStart, 0, 0, 0, s.loc)

	for day.Before(windowEnd.Add(24 * time.Hour)) {
		dayEnd := time.Date(day.Year(), day.Month(), day.Day(), workdayEnd, 0, 0, 0, s.loc)
		for t := day; !t.Add(step).After(dayEnd); t = t.Add(step) {
			grid = append(grid, t.UTC())
		}
		day = day.AddDate(0, 0, 1)
		day = time.Date(day.Year(), day.Month(), day.Day(), workdayStart, 0, 0, 0, s.loc)
	}
	return grid
}

// isValidSlotStartLocked проверяет, что старт совпадает с одним из узлов сетки слотов.
func (s *Store) isValidSlotStartLocked(et model.EventType, start time.Time) bool {
	windowEnd := s.windowEndLocked(time.Now())
	for _, g := range s.gridLocked(et, start.Add(-24*time.Hour), windowEnd) {
		if g.Equal(start) {
			return true
		}
	}
	return false
}

// overlapsLocked сообщает, пересекается ли интервал [start,end) с любой
// подтверждённой бронью. excludeID позволяет исключить конкретную бронь.
func (s *Store) overlapsLocked(start, end time.Time, excludeID string) bool {
	for id, b := range s.bookings {
		if id == excludeID || b.Status != model.StatusConfirmed {
			continue
		}
		if start.Before(b.End) && b.Start.Before(end) {
			return true
		}
	}
	return false
}

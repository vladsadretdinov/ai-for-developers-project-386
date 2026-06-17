package httpapi

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"booking-calendar/backend/internal/model"
	"booking-calendar/backend/internal/store"
)

func (h *Handler) getOwner(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.store.Owner())
}

// --- Event types ---

func (h *Handler) listEventTypes(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, h.store.ListEventTypes())
}

func (h *Handler) getEventType(w http.ResponseWriter, r *http.Request) {
	et, err := h.store.GetEventType(r.PathValue("eventTypeId"))
	if err != nil {
		writeNotFound(w, "Тип события не найден.")
		return
	}
	writeJSON(w, http.StatusOK, et)
}

func (h *Handler) createEventType(w http.ResponseWriter, r *http.Request) {
	var in model.EventTypeCreate
	if !decodeJSON(w, r, &in) {
		return
	}
	if fields := validateEventType(in); len(fields) > 0 {
		writeValidation(w, "", fields)
		return
	}
	et, _ := h.store.CreateEventType(in)
	writeJSON(w, http.StatusCreated, et)
}

func (h *Handler) updateEventType(w http.ResponseWriter, r *http.Request) {
	var in model.EventTypeCreate
	if !decodeJSON(w, r, &in) {
		return
	}
	if fields := validateEventType(in); len(fields) > 0 {
		writeValidation(w, "", fields)
		return
	}
	et, err := h.store.UpdateEventType(r.PathValue("eventTypeId"), in)
	if err != nil {
		writeNotFound(w, "Тип события не найден.")
		return
	}
	writeJSON(w, http.StatusOK, et)
}

func (h *Handler) deleteEventType(w http.ResponseWriter, r *http.Request) {
	if err := h.store.DeleteEventType(r.PathValue("eventTypeId")); err != nil {
		writeNotFound(w, "Тип события не найден.")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// --- Bookings ---

func (h *Handler) listBookings(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	from, ok := parseOptionalTime(w, q.Get("from"), "from")
	if !ok {
		return
	}
	to, ok := parseOptionalTime(w, q.Get("to"), "to")
	if !ok {
		return
	}

	// По умолчанию показываем только confirmed.
	status := model.BookingStatus(q.Get("status"))
	if status == "" {
		status = model.StatusConfirmed
	} else if status != model.StatusConfirmed && status != model.StatusCancelled {
		writeValidation(w, "Недопустимый статус.", []string{"status"})
		return
	}

	writeJSON(w, http.StatusOK, h.store.ListBookings(from, to, status))
}

func (h *Handler) getBooking(w http.ResponseWriter, r *http.Request) {
	b, err := h.store.GetBooking(r.PathValue("bookingId"))
	if err != nil {
		writeNotFound(w, "Бронирование не найдено.")
		return
	}
	writeJSON(w, http.StatusOK, b)
}

func (h *Handler) cancelBooking(w http.ResponseWriter, r *http.Request) {
	b, err := h.store.CancelBooking(r.PathValue("bookingId"))
	if err != nil {
		writeNotFound(w, "Бронирование не найдено.")
		return
	}
	writeJSON(w, http.StatusOK, b)
}

// --- Slots ---

func (h *Handler) listSlots(w http.ResponseWriter, r *http.Request) {
	now := time.Now()
	from := now
	if raw := r.URL.Query().Get("from"); raw != "" {
		t, ok := parseOptionalTime(w, raw, "from")
		if !ok {
			return
		}
		from = *t
	}

	list, err := h.store.ListSlots(r.PathValue("eventTypeId"), from, now)
	if err != nil {
		writeNotFound(w, "Тип события не найден.")
		return
	}
	writeJSON(w, http.StatusOK, list)
}

// --- Public booking creation ---

func (h *Handler) createBooking(w http.ResponseWriter, r *http.Request) {
	var in model.BookingCreate
	if !decodeJSON(w, r, &in) {
		return
	}
	if fields := validateBooking(in); len(fields) > 0 {
		writeValidation(w, "", fields)
		return
	}

	b, err := h.store.CreateBooking(in, time.Now())
	switch {
	case errors.Is(err, store.ErrNotFound):
		writeNotFound(w, "Тип события не найден.")
	case errors.Is(err, store.ErrSlotTaken):
		writeSlotTaken(w, "Выбранное время уже занято или находится вне окна записи 14 дней.")
	case err != nil:
		writeValidation(w, err.Error(), nil)
	default:
		writeJSON(w, http.StatusCreated, b)
	}
}

// --- helpers ---

func decodeJSON(w http.ResponseWriter, r *http.Request, dst any) bool {
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(dst); err != nil {
		writeValidation(w, "Некорректный формат запроса: "+err.Error(), nil)
		return false
	}
	return true
}

func parseOptionalTime(w http.ResponseWriter, raw, field string) (*time.Time, bool) {
	if raw == "" {
		return nil, true
	}
	t, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		writeValidation(w, "Некорректный формат даты в параметре "+field+".", []string{field})
		return nil, false
	}
	return &t, true
}

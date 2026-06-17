package httpapi

import (
	"regexp"
	"strings"
	"unicode/utf8"

	"booking-calendar/backend/internal/model"
)

var emailRe = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

// validateEventType проверяет данные типа события согласно ограничениям контракта.
func validateEventType(in model.EventTypeCreate) []string {
	var fields []string
	title := strings.TrimSpace(in.Title)
	if title == "" || utf8.RuneCountInString(title) > 120 {
		fields = append(fields, "title")
	}
	if utf8.RuneCountInString(in.Description) > 2000 {
		fields = append(fields, "description")
	}
	if in.DurationMinutes < 1 || in.DurationMinutes > 1440 {
		fields = append(fields, "durationMinutes")
	}
	return fields
}

// validateBooking проверяет данные гостя согласно ограничениям контракта.
func validateBooking(in model.BookingCreate) []string {
	var fields []string
	if strings.TrimSpace(in.EventTypeID) == "" {
		fields = append(fields, "eventTypeId")
	}
	if in.Start.IsZero() {
		fields = append(fields, "start")
	}
	name := strings.TrimSpace(in.GuestName)
	if name == "" || utf8.RuneCountInString(name) > 120 {
		fields = append(fields, "guestName")
	}
	if !emailRe.MatchString(in.GuestEmail) {
		fields = append(fields, "guestEmail")
	}
	if utf8.RuneCountInString(in.Notes) > 2000 {
		fields = append(fields, "notes")
	}
	return fields
}

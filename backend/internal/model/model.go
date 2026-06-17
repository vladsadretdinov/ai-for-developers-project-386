// Package model описывает доменные сущности контракта Booking Calendar API.
package model

import "time"

// BookingStatus — статус бронирования.
type BookingStatus string

const (
	StatusConfirmed BookingStatus = "confirmed"
	StatusCancelled BookingStatus = "cancelled"
)

// Owner — владелец календаря (единственный предзаданный профиль, только чтение).
type Owner struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	TimeZone string `json:"timeZone"`
}

// EventType — тип события, на который можно записаться.
type EventType struct {
	ID              string `json:"id"`
	Title           string `json:"title"`
	Description     string `json:"description"`
	DurationMinutes int    `json:"durationMinutes"`
}

// EventTypeCreate — данные для создания/обновления типа события.
type EventTypeCreate struct {
	Title           string `json:"title"`
	Description     string `json:"description"`
	DurationMinutes int    `json:"durationMinutes"`
}

// Booking — бронирование слота гостем.
type Booking struct {
	ID          string        `json:"id"`
	EventTypeID string        `json:"eventTypeId"`
	Start       time.Time     `json:"start"`
	End         time.Time     `json:"end"`
	GuestName   string        `json:"guestName"`
	GuestEmail  string        `json:"guestEmail"`
	Notes       string        `json:"notes,omitempty"`
	Status      BookingStatus `json:"status"`
	CreatedAt   time.Time     `json:"createdAt"`
}

// BookingCreate — данные для создания бронирования гостем.
type BookingCreate struct {
	EventTypeID string    `json:"eventTypeId"`
	Start       time.Time `json:"start"`
	GuestName   string    `json:"guestName"`
	GuestEmail  string    `json:"guestEmail"`
	Notes       string    `json:"notes,omitempty"`
}

// Slot — свободный интервал для записи на конкретный тип события.
type Slot struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// SlotList — свободные слоты типа события в окне записи.
type SlotList struct {
	EventTypeID string    `json:"eventTypeId"`
	WindowStart time.Time `json:"windowStart"`
	WindowEnd   time.Time `json:"windowEnd"`
	Slots       []Slot    `json:"slots"`
}

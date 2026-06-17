// Package httpapi реализует HTTP-роутер и обработчики по контракту
// Booking Calendar API (tsp-output/openapi.yaml).
package httpapi

import (
	"net/http"

	"booking-calendar/backend/internal/store"
)

// Handler собирает маршруты контракта и оборачивает их в CORS-middleware.
type Handler struct {
	store *store.Store
	mux   *http.ServeMux
}

// NewHandler создаёт http.Handler со всеми маршрутами контракта.
func NewHandler(s *store.Store) http.Handler {
	h := &Handler{store: s, mux: http.NewServeMux()}
	h.routes()
	return cors(h.mux)
}

func (h *Handler) routes() {
	// Owner / admin
	h.mux.HandleFunc("GET /admin/owner", h.getOwner)

	h.mux.HandleFunc("GET /admin/event-types", h.listEventTypes)
	h.mux.HandleFunc("POST /admin/event-types", h.createEventType)
	h.mux.HandleFunc("GET /admin/event-types/{eventTypeId}", h.getEventType)
	h.mux.HandleFunc("PUT /admin/event-types/{eventTypeId}", h.updateEventType)
	h.mux.HandleFunc("DELETE /admin/event-types/{eventTypeId}", h.deleteEventType)

	h.mux.HandleFunc("GET /admin/bookings", h.listBookings)
	h.mux.HandleFunc("GET /admin/bookings/{bookingId}", h.getBooking)
	h.mux.HandleFunc("DELETE /admin/bookings/{bookingId}", h.cancelBooking)

	// Guest / public
	h.mux.HandleFunc("GET /public/event-types", h.listEventTypes)
	h.mux.HandleFunc("GET /public/event-types/{eventTypeId}", h.getEventType)
	h.mux.HandleFunc("GET /public/event-types/{eventTypeId}/slots", h.listSlots)
	h.mux.HandleFunc("POST /public/bookings", h.createBooking)
}

// cors разрешает запросы фронтенд-клиента (отдельное SPA).
func cors(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

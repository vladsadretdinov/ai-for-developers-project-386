// Command server запускает HTTP-сервер Booking Calendar API.
//
// Хранилище — in-memory: после перезапуска данные сбрасываются.
package main

import (
	"log"
	"net/http"
	"os"

	"booking-calendar/backend/internal/httpapi"
	"booking-calendar/backend/internal/store"
)

func main() {
	addr := ":3000"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}

	s := store.New()
	handler := httpapi.NewHandler(s)

	log.Printf("Booking Calendar API слушает на %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("сервер остановлен: %v", err)
	}
}

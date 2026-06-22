// Command server запускает HTTP-сервер Booking Calendar API.
//
// Хранилище — in-memory: после перезапуска данные сбрасываются.
//
// Режимы работы:
//   - dev/тесты: если статика фронтенда не смонтирована, API отдаётся с корня
//     (`/public/*`, `/admin/*`) — так работает прокси фронтенд-дев-сервера и e2e.
//   - продакшн/контейнер: если задан каталог со статикой (STATIC_DIR), сервер
//     отдаёт API под префиксом `/api/*`, а на остальные пути — собранный
//     Angular-SPA (с фолбэком на index.html для клиентских маршрутов).
package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"booking-calendar/backend/internal/httpapi"
	"booking-calendar/backend/internal/store"
)

func main() {
	addr := ":3001"
	if p := os.Getenv("PORT"); p != "" {
		addr = ":" + p
	}

	s := store.New()
	handler := buildHandler(s)

	log.Printf("Booking Calendar API слушает на %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatalf("сервер остановлен: %v", err)
	}
}

// buildHandler собирает итоговый http.Handler в зависимости от наличия статики.
func buildHandler(s *store.Store) http.Handler {
	api := httpapi.NewHandler(s)

	staticDir := os.Getenv("STATIC_DIR")
	if staticDir == "" {
		staticDir = "./public"
	}

	if info, err := os.Stat(staticDir); err != nil || !info.IsDir() {
		// Статики нет — отдаём API напрямую с корня (dev, тесты, e2e-прокси).
		return api
	}

	log.Printf("Отдаём статику фронтенда из %s, API под /api/*", staticDir)
	mux := http.NewServeMux()
	mux.Handle("/api/", http.StripPrefix("/api", api))
	mux.Handle("/", spaHandler(staticDir))
	return mux
}

// spaHandler отдаёт статические файлы из dir, а для несуществующих путей —
// index.html (клиентская маршрутизация Angular).
func spaHandler(dir string) http.Handler {
	fileServer := http.FileServer(http.Dir(dir))
	index := filepath.Join(dir, "index.html")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" {
			clean := filepath.Clean(r.URL.Path)
			path := filepath.Join(dir, clean)
			// Не выходим за пределы каталога статики.
			if rel, err := filepath.Rel(dir, path); err == nil && !startsWithDotDot(rel) {
				if st, err := os.Stat(path); err == nil && !st.IsDir() {
					fileServer.ServeHTTP(w, r)
					return
				}
			}
		}
		http.ServeFile(w, r, index)
	})
}

func startsWithDotDot(p string) bool {
	return len(p) >= 2 && p[0] == '.' && p[1] == '.'
}

package httpapi

import (
	"encoding/json"
	"net/http"
)

// apiError — формат тела ошибки из контракта (ApiError и его специализации).
type apiError struct {
	Code    string   `json:"code"`
	Message string   `json:"message"`
	Fields  []string `json:"fields,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if body != nil {
		_ = json.NewEncoder(w).Encode(body)
	}
}

func writeNotFound(w http.ResponseWriter, msg string) {
	if msg == "" {
		msg = "Запрашиваемый ресурс не найден."
	}
	writeJSON(w, http.StatusNotFound, apiError{Code: "not_found", Message: msg})
}

func writeSlotTaken(w http.ResponseWriter, msg string) {
	if msg == "" {
		msg = "Выбранное время уже занято или находится вне окна записи."
	}
	writeJSON(w, http.StatusConflict, apiError{Code: "slot_taken", Message: msg})
}

func writeValidation(w http.ResponseWriter, msg string, fields []string) {
	if msg == "" {
		msg = "Некорректные входные данные."
	}
	writeJSON(w, http.StatusUnprocessableEntity, apiError{
		Code:    "validation_failed",
		Message: msg,
		Fields:  fields,
	})
}

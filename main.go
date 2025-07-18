package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type Device struct {
	Name   string `json:"name"`
	Device string `json:"device"`
}

type APIResponse struct {
	Code    string      `json:"code"`
	Message string      `json:"message,omitempty"`
	Results interface{} `json:"results,omitempty"`
}

func main() {
	http.Handle("/", http.FileServer(http.Dir("./static")))

	http.HandleFunc("/devices", func(w http.ResponseWriter, r *http.Request) {
		// Simulasi perangkat login
		resp := APIResponse{
			Code: "SUCCESS",
			Results: []Device{
				{Name: "Chrome", Device: "Windows"},
			},
		}
		json.NewEncoder(w).Encode(resp)
	})

	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		resp := APIResponse{
			Code: "SUCCESS",
			Results: map[string]interface{}{
				"qr_link":     "https://via.placeholder.com/200x200.png?text=Scan+QR",
				"qr_duration": 30,
			},
		}
		json.NewEncoder(w).Encode(resp)
	})

	http.HandleFunc("/logout", func(w http.ResponseWriter, r *http.Request) {
		resp := APIResponse{
			Code:    "SUCCESS",
			Message: "Logout berhasil",
		}
		json.NewEncoder(w).Encode(resp)
	})

	fmt.Println("Server running on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

# Gunakan base image ringan
FROM golang:1.21-alpine AS builder

# Install git (jika ada dependency dari Git) dan buat direktori kerja
RUN apk add --no-cache git
WORKDIR /app

# Salin semua file ke dalam image
COPY . .

# Inisialisasi dan build
RUN go mod init qrapp && go mod tidy && go build -o app

# Tahap akhir, gunakan base image lebih ringan (alpine)
FROM alpine:latest

# Tambahkan CA certificates untuk HTTPS (jika fetch ke luar)
RUN apk add --no-cache ca-certificates

# Direktori untuk aplikasi
WORKDIR /root/

# Salin binary dari tahap builder
COPY --from=builder /app/app .

# Salin folder static
COPY --from=builder /app/static ./static

# Expose port
EXPOSE 8080

# Jalankan aplikasi
CMD ["./app"]

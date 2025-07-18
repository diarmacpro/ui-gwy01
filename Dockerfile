FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git
WORKDIR /app

COPY . .

RUN go mod tidy && go build -o app

FROM alpine:latest

RUN apk add --no-cache ca-certificates
WORKDIR /root/

COPY --from=builder /app/app .
COPY --from=builder /app/static ./static

EXPOSE 8080

CMD ["./app"]

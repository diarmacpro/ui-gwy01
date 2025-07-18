const $ = (id) => document.getElementById(id);
const qrBox = $("qrBox");
const qrImg = $("qrImg");
const countdown = $("countdown");
const status = $("status");
const deviceInfo = $("deviceInfo");
const logoutBtn = $("logoutBtn");

let timer = null;

function fetchDevice() {
  status.textContent = "Memeriksa perangkat...";
  fetch("https://gwa.zeabur.app/app/devices")
    .then(res => res.json())
    .then(json => {
      if (json.code === "SUCCESS" && Array.isArray(json.results) && json.results.length > 0) {
        showDevice(json.results[0]);
      } else {
        getQR();
      }
    })
    .catch(() => status.textContent = "Gagal memeriksa perangkat.");
}

function showDevice(device) {
  qrBox.classList.add("hidden");
  deviceInfo.textContent = `Perangkat aktif: ${device.name} (${device.device})`;
  deviceInfo.classList.remove("hidden");
  logoutBtn.classList.remove("hidden");
  status.textContent = "Sudah login.";
}

function getQR() {
  status.textContent = "Mengambil QR...";
  fetch("https://gwa.zeabur.app/app/login")
    .then(res => res.json())
    .then(json => {
      if (json.code === "SUCCESS" && json.results) {
        const { qr_link, qr_duration } = json.results;
        qrImg.src = qr_link;
        const qr_drt = qr_duration;
        countdown.textContent = qr_drt;
        qrBox.classList.remove("hidden");
        deviceInfo.classList.add("hidden");
        logoutBtn.classList.add("hidden");
        status.textContent = "Silakan scan QR untuk login.";
        startCountdown(qr_drt);
      } else if (json.code === "ALREADY_LOGGED_IN") {
        fetchDevice();
      } else {
        status.textContent = json.message || "Gagal mengambil QR.";
      }
    })
    .catch(() => status.textContent = "Gagal menghubungi server.");
}

function startCountdown(duration) {
  clearInterval(timer);
  let seconds = duration;
  timer = setInterval(() => {
    seconds--;
    countdown.textContent = seconds;
    if (seconds <= 0) {
      clearInterval(timer);
      getQR(); // reload QR
    }
  }, 1000);
}

logoutBtn.addEventListener("click", () => {
  status.textContent = "Mengirim permintaan logout...";
  fetch("https://gwa.zeabur.app/app/logout")
    .then(res => res.json())
    .then(json => {
      if (json.code === "SUCCESS") {
        status.textContent = "Berhasil logout. Memeriksa ulang...";
        deviceInfo.classList.add("hidden");
        logoutBtn.classList.add("hidden");
        getQR();
      } else {
        status.textContent = json.message || "Gagal logout.";
      }
    })
    .catch(() => status.textContent = "Logout gagal.");
});


let socket;

function connectWebSocket() {
  socket = new WebSocket("wss://gwa.zeabur.app/ws");

  socket.addEventListener("open", () => {
    console.log("WebSocket terkoneksi");
    status.textContent = "WebSocket terkoneksi.";
    socket.send(JSON.stringify({ code: "FETCH_DEVICES" }));
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("WebSocket message:", data);

      switch (data.code) {
        case "LIST_DEVICES":
          if (Array.isArray(data.result) && data.result.length > 0) {
            showDevice(data.result[0]);
          } else {
            getQR();
          }
          break;

        case "LOGIN_SUCCESS":
          status.textContent = "Login berhasil!";
          fetchDevice(); // Refresh perangkat dari endpoint REST
          break;

        case "INCOMING_MESSAGE":
          const msg = data.result;
          console.log("Pesan masuk:", msg);

          const from = msg.from;
          const text = msg.message?.conversation || "[non-text message]";

          const div = document.createElement("div");
          div.textContent = `Dari ${from}: ${text}`;
          div.className = "text-sm text-blue-800 mt-2"; // styling optional
          document.body.appendChild(div);
          break;


        default:
          console.log("Kode WebSocket tidak ditangani:", data.code);
      }
    } catch (err) {
      console.error("Gagal parsing pesan WebSocket:", err);
    }
  });

  socket.addEventListener("close", () => {
    console.warn("WebSocket terputus. Coba ulang...");
    status.textContent = "WebSocket terputus. Mencoba ulangi...";
    setTimeout(connectWebSocket, 3000);
  });

  socket.addEventListener("error", (error) => {
    console.error("WebSocket error:", error);
  });
}

fetchDevice();
connectWebSocket();

// --- WebSocket ke wbhk01 (webhook relay) ---
function connectWebhookWS() {
  // Ganti URL sesuai domain/IP VPS kamu
  const ws = new WebSocket("wss://wbhk01.zeabur.app/ws");

  ws.addEventListener("open", () => {
    console.log("[wbhk01] WebSocket terkoneksi");
  });

  ws.addEventListener("message", (event) => {
    // Asumsikan payload dari webhook adalah JSON atau string
    let data = event.data;
    try {
      data = JSON.parse(event.data);
    } catch {}
    console.log("[wbhk01] Pesan masuk:", data);

    // Tampilkan ke halaman (opsional, bisa diubah sesuai kebutuhan)
    const div = document.createElement("div");
    div.textContent = `[wbhk01] ${typeof data === 'object' ? JSON.stringify(data) : data}`;
    div.className = "text-xs text-green-800 mt-2";
    document.body.appendChild(div);
  });

  ws.addEventListener("close", () => {
    console.warn("[wbhk01] WebSocket terputus. Coba ulang...");
    setTimeout(connectWebhookWS, 3000);
  });

  ws.addEventListener("error", (error) => {
    console.error("[wbhk01] WebSocket error:", error);
  });
}

connectWebhookWS();
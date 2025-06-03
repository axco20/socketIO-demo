function randomPastelColor() {
  const h = Math.floor(Math.random() * 360);
  const s = 60 + Math.random() * 20; 
  const l = 75 + Math.random() * 10; 
  return `hsl(${h}, ${s}%, ${l}%)`;
}

const userColor = randomPastelColor();

const socket = io();
const form = document.getElementById("chatForm");
const input = document.getElementById("msgInput");
const messages = document.getElementById("messages");

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const msgText = input.value.trim();
  if (!msgText) return;
  socket.emit("chat message", {
    text: msgText,
    color: userColor
  });
  input.value = "";
});

socket.on("chat message", ({ text, color }) => {
  const item = document.createElement("li");
  item.textContent = text;
  item.style.backgroundColor = color;          
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
});

socket.on("user connected", () => {
  Toastify({
    text: "A user has joined the chat",
    duration: 3000,
    gravity: "top",
    position: "right",
    style: {
      background: "#7e57c2",
      color: "#fff",
      fontSize: "20px",
      padding: "20px 30px",
      borderRadius: "8px",
      minWidth: "350px",
      maxWidth: "400px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
    },
    stopOnFocus: true,
  }).showToast();
});

socket.on("user disconnected", () => {
  Toastify({
    text: "A user has left the chat",
    duration: 3000,
    gravity: "top",
    position: "right",
    style: {
      background: "#b31010",
      color: "#fff",
      fontSize: "20px",
      padding: "20px 30px",
      borderRadius: "8px",
      minWidth: "350px",
      maxWidth: "400px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)"
    },
    stopOnFocus: true,
  }).showToast();
});

let currentUserCount = 0;
const tadpoleHeader = document.getElementById("tadpoleHeader");

socket.on("user count", (count) => {
  currentUserCount = count;
  tadpoleHeader.textContent = `${count} connected user${count === 1 ? "" : "s"} in the chat room`;
  TadpoleAnimator.setTadpoleCount(count);
});

const TadpoleAnimator = (function () {
  const canvas = document.getElementById("tadpoleCanvas");
  const ctx = canvas.getContext("2d");
  let tadpoles = [];
  let width = canvas.width;
  let height = canvas.height;
  let animationId = null;

  const NUM_PATH_POINTS = 10;
  const MAX_SPEED = 1.0;
  const MIN_SPEED = 0.3;
  const BODY_RADIUS = 6;
  const TAIL_LENGTH = 30;
  const TAIL_WIDTH = 2;

  function rnd(min, max) {
    return min + Math.random() * (max - min);
  }

  function createTadpoles(n) {
    tadpoles = [];
    for (let i = 0; i < n; i++) {
      const x0 = rnd(BODY_RADIUS + TAIL_LENGTH, width - BODY_RADIUS - TAIL_LENGTH);
      const y0 = rnd(BODY_RADIUS, height - BODY_RADIUS);
      const angle = rnd(0, 2 * Math.PI);
      const speed = rnd(MIN_SPEED, MAX_SPEED);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;

      const path = Array(NUM_PATH_POINTS).fill().map(() => ({ x: x0, y: y0 }));
      tadpoles.push({ x: x0, y: y0, vx, vy, path });
    }
  }

  function updateTadpoles() {
    for (const t of tadpoles) {
      t.x += t.vx;
      t.y += t.vy;

      if (t.x < BODY_RADIUS || t.x > width - BODY_RADIUS) t.vx *= -1;
      if (t.y < BODY_RADIUS || t.y > height - BODY_RADIUS) t.vy *= -1;

      t.path.pop();
      t.path.unshift({ x: t.x, y: t.y });
    }
  }

  function drawTadpoles() {
    ctx.clearRect(0, 0, width, height);

    for (const t of tadpoles) {
      ctx.save();
      ctx.translate(t.x, t.y);
      const headAngle = Math.atan2(t.vy, t.vx);
      ctx.rotate(headAngle);
      ctx.beginPath();
      ctx.ellipse(0, 0, BODY_RADIUS, BODY_RADIUS * 0.6, 0, 0, 2 * Math.PI);
      ctx.fillStyle = "#7e57c2";
      ctx.fill();
      ctx.restore();

      ctx.beginPath();
      const tailPoints = t.path;
      ctx.moveTo(tailPoints[0].x, tailPoints[0].y);
      for (let i = 1; i < tailPoints.length; i++) {
        const p = tailPoints[i];
        ctx.lineTo(p.x, p.y);
      }
      ctx.strokeStyle = "#7e57c2";
      ctx.lineWidth = TAIL_WIDTH;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  function animate() {
    updateTadpoles();
    drawTadpoles();
    animationId = requestAnimationFrame(animate);
  }

  return {
    setTadpoleCount(n) {
      cancelAnimationFrame(animationId);
      createTadpoles(n);
      animate();
    }
  };
})();

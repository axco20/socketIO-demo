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
const svg = d3.select("#tadpoleSvg");
const SVG_WIDTH = +svg.attr("width");
const SVG_HEIGHT = +svg.attr("height");

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
  const tadpoles = [];
  for (let i = 0; i < n; i++) {
    const x0 = rnd(BODY_RADIUS + TAIL_LENGTH, SVG_WIDTH - (BODY_RADIUS + TAIL_LENGTH));
    const y0 = rnd(BODY_RADIUS, SVG_HEIGHT - BODY_RADIUS);
    const angle = rnd(0, 2 * Math.PI);
    const speed = rnd(MIN_SPEED, MAX_SPEED);
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    const path = Array(NUM_PATH_POINTS).fill().map(() => ({ x: x0, y: y0 }));

    tadpoles.push({ x: x0, y: y0, vx, vy, path });
  }
  return tadpoles;
}

const tailLine = d3.line()
  .x(d => d.x)
  .y(d => d.y)
  .curve(d3.curveBasis); 

let tadpoles = [];
let tadpoleG = svg.selectAll("g.tadpole"); 

function updateTadpoleElements() {
  tadpoleG = tadpoleG
    .data(tadpoles, (d, i) => i); 

  tadpoleG.exit().remove();
  const gEnter = tadpoleG
    .enter()
    .append("g")
    .attr("class", "tadpole");

  gEnter.append("ellipse")
    .attr("rx", BODY_RADIUS)
    .attr("ry", BODY_RADIUS * 0.6)
    .attr("fill", "#7e57c2");
  
  gEnter.append("path")
    .attr("stroke", "#7e57c2")
    .attr("stroke-width", TAIL_WIDTH)
    .attr("fill", "none")
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

  tadpoleG = gEnter.merge(tadpoleG);
}

function animateTadpoles(elapsed) {
  tadpoles.forEach(t => {
    t.x += t.vx;
    t.y += t.vy;

    if (t.x < BODY_RADIUS || t.x > SVG_WIDTH - BODY_RADIUS) t.vx *= -1;
    if (t.y < BODY_RADIUS || t.y > SVG_HEIGHT - BODY_RADIUS) t.vy *= -1;

    t.path.pop();
    t.path.unshift({ x: t.x, y: t.y });
  });

  tadpoleG.each(function(d) {
    const g = d3.select(this);

    const headAngle = Math.atan2(d.vy, d.vx) * 180 / Math.PI; 
    g.select("ellipse")
      .attr("cx", d.x)
      .attr("cy", d.y)
      .attr("transform", `rotate(${headAngle}, ${d.x}, ${d.y})`);

    g.select("path")
      .attr("d", tailLine(d.path));
  });
}

const timer = d3.timer((elapsed) => {
  animateTadpoles(elapsed);
});

socket.on("user count", (count) => {
  const header = document.getElementById("tadpoleHeader");
  header.textContent = `${count} connected user${count === 1 ? "" : "s"} in the chat room`;

  tadpoles = createTadpoles(count);
  updateTadpoleElements();
});
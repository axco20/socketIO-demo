const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

let userCount = 0;

io.on("connection", (socket) => {
  userCount++;
  socket.broadcast.emit("user connected");  
  io.emit("user count", userCount);

  socket.on("chat message", (msg) => {
    io.emit("chat message", msg);
  });

  socket.on("disconnect", () => {
    userCount = Math.max(0, userCount - 1);

    socket.broadcast.emit("user disconnected");
    io.emit("user count", userCount);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

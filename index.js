const path = require("path");
const express = require('express');
const socketio = require('socket.io');
const http = require('http');
const session = require('express-session');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

//static folder
app.use(express.static(path.join(__dirname, "/public")));

//init session
const sessionMiddleware = session({
  secret: "secret",
  resave: false,
  saveUninitialized: false,
});
app.use(sessionMiddleware);

//share sessions with sockets
io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

app.get("/", (req, res) => {
    res.sendFile("index.html");
});

io.on('connection', (socket) => {
  console.log("socket connected!");

  socket.on('time', (time) => {
    socket.emit("time", time);
  });

  socket.on('position', (position) => {
    io.emit('position', position);
  })
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log("Server started on port " + PORT);
});

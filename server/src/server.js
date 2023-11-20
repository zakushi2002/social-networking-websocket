require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express(); // app express
const port = process.env.PORT || 3107;
const hostname = process.env.HOST_NAME || `localhost` || `127.0.0.1`;
const socket = require("socket.io");

app.use(cors());
app.use(helmet());
app.use(express.json()); // for parsing application/json
app.get("/", (req, res) => {
  res.send("hello from simple server :)");
});

const server = app.listen(port, hostname, () => {
  console.log(
    `Server listening on port ${port}!\nDevelopment: http://${hostname}:${port}`
  );
});

const io = socket(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "DELETE", "UPDATE", "PUT", "PATCH"],
  },
});

io.on("connection", (socket) => {
  console.log("a user connected ", socket.id);
});

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express(); // app express
const port = process.env.PORT || 3107;
const hostname = process.env.HOST_NAME || `localhost` || `127.0.0.1`;
// const { Server } = require("socket.io");
// const io = new Server(app);
const database = require("./config/database");

app.use(cors());
app.use(express.json()); // for parsing application/json

// io.on("connection", (socket) => {
//   console.log("a user connected", socket.id);

//   socket.on("room", (data) => {
//     console.log(data);
//     socket.join(data.room);
//   });

//   socket.on("send", (data) => {
//     console.log(data);
//     socket.to(data.room).emit("receive", {
//       message: data.message,
//       room: data.room,
//     });
//   });
//   socket.on("typing", (data) => {
//     socket.to(data.room).emit("typing");
//   });
// });

app.listen(port, hostname, () => {
  console.log(
    `Server listening on port ${port}!\nDevelopment: http://${hostname}:${port}`
  );
});

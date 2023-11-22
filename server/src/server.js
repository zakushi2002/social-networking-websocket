require("dotenv").config();
const port = process.env.PORT || 3107;
const hostname = process.env.HOST_NAME || `localhost` || `127.0.0.1`;
const { createServer } = require("http");
const { Server } = require("socket.io");

const server = createServer();

server.listen(port, hostname, () => {
  console.log(
    `Server listening on port ${port}!\nDevelopment: http://${hostname}:${port}`
  );
});
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
  },
});

let accountsOnline = [];

const addUser = (accountId, socketId) => {
  !accountsOnline.some((account) => account.accountId === accountId) &&
    accountsOnline.push({ accountId, socketId });
};

const removeUser = (accountId, socketId) => {
  accountsOnline = accountsOnline.filter(
    (account) => account.socketId !== socketId
  );
};

const getUser = (accountId) => {
  return accountsOnline.find((account) => account.accountId === accountId);
};

// When an account logs in, that account will pull all of its notifications from the database that the account has previously viewed
// and just received during the time the account was offline, such as notifications that someone has followed the account and someone commented on the account's post

io.on("connection", (socket) => {
  // When an account logs in, that account will join a room with its accountId
  let accountId = socket.handshake.query.accountId;
  console.log(`socket ${socket.id} connected with account ${accountId}`);
  // Add the account to the list of accounts online
  addUser(accountId, socket.id);
  // Count the number of accounts online
  console.log(accountsOnline.length);
  // Join the room with the account's accountId
  socket.join(`account-${accountId}`);
  // Send a notification of the account's online status to the account
  io.to(accountId).emit(
    `online`,
    `Hello ${accountId}! You are in the room ${accountId}!`
  );

  socket.on(
    "join-notification-room",
    ({ myPostNotificationRooms, newPostOfFollowingNotificationRooms }) => {
      // data {"myPostNotificationRooms": [postId1, postId2, postId3, ...]",
      // "newPostOfFollowingNotificationRooms": [accountId1, accountId2, accountId3, ...]"}
      // myPostNotificationRooms is an array of the account's post notification rooms [postId1, postId2, postId3, ...]

      myPostNotificationRooms.forEach((element) => {
        socket.join(`my-post-${element}`);
      });

      // newPostOfFollowingNotificationRooms is an array of the account's following's post notification rooms [accountId1, accountId2, accountId3, ...]
      newPostOfFollowingNotificationRooms.forEach((element) => {
        socket.join(`my-following-${element}`);
        console.log(`my-following-${element}`);
      });
    }
  );

  // Event new comment on a post of the account that except the account itself
  socket.on(
    "send-notification-new-comment",
    ({ postId, commentId, commenter }) => {
      // data { "postId": postId, "commentId": commentId }
      console.log(postId, commentId);
      // Send the comment to the post notification room of the post
      socket
        .to(`my-post-${postId}`)
        .emit("get-notification-new-comment", { postId, commentId, commenter });
    }
  );

  // Event new post of a following of the account
  socket.on(
    "send-notification-new-post-of-following",
    ({ accountId, postId }) => {
      // data { "accountId": accountId, "postId": postId }
      // Send the post to the following's post notification room of the following
      socket
        .to(`my-following-${accountId}`)
        .emit("get-notification-new-post-of-following", { accountId, postId });
    }
  );

  // Event new follower of the account
  socket.on("send-notification-new-follower", ({ accountId, followerId }) => {
    // data { "accountId": accountId, "followerId": followerId }
    console.log(accountId, followerId);
    // Send the follower to the account's notification room
    socket
      .to(`account-${followerId}`)
      .emit("get-notification-new-follower", { accountId, followerId });
  });

  // Event when the accoutn unfollows a following
  socket.on("send-notification-unfollow", ({ followingId }) => {
    // data { "accountId": accountId, "followingId": followingId }
    // Send the unfollowing to the account's notification room
    socket.leave(`my-following-${followingId}`);
  });

  // Event when the account deletes a post
  socket.on("send-notification-delete-post", ({ postId }) => {
    // data { "postId": postId }
    // Send the deleted post to the account's notification room
    socket.leave(`my-post-${postId}`);
  });

  // Account disconnected due to reason
  socket.on("disconnect", (reason) => {
    console.log(`socket ${socket.id} disconnected due to ${reason}`);
    removeUser(accountId, socket.id);
  });
  console.log(socket.rooms);
});

io.listen(port);

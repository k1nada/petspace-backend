require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRouter = require("./routers/authRouter");
const breedsRouter = require("./routers/breedsRouter");
const countriesRouter = require("./routers/countriesRouter");
const photoRouter = require("./routers/photoRouter");
const postRouter = require("./routers/postRouter");
const postwallRouter = require("./routers/postwallRouter");
const commentRouter = require("./routers/commentRouter");
const friendsRouter = require("./routers/friendsRouter");
const likesRouter = require("./routers/likesRouter");
const chatRouter = require("./routers/chatRouter");
const Message = require("./models/Message");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

app.use(cors());
app.use(express.json());
app.use(authRouter);
app.use("/breeds", breedsRouter);
app.use("/countries", countriesRouter);
app.use("/api/upload", photoRouter);
app.use("/posts", postRouter);
app.use("/postwall", postwallRouter);
app.use("/comments", commentRouter);
app.use("/friends", friendsRouter);
app.use("/likes", likesRouter);
app.use("/chat", chatRouter);

io.on("connection", (socket) => {
  socket.on("join", (roomId) => socket.join(roomId));

  socket.on("message", async ({ roomId, senderId, text }) => {
    try {
      const message = await Message.create({ roomId, sender: senderId, text });
      const populated = await message.populate("sender", "username name avatar");

      io.to(roomId).emit("message", populated);
    } catch (e) {
      console.error(e);
    }
  });
});

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    http.listen(process.env.PORT, () =>
      console.log(`Server started on port ${process.env.PORT}`),
    );
  } catch (e) {
    console.error(e);
  }
};

start();
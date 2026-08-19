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
const familyRouter = require("./routers/familyRouter");
const followsRouter = require("./routers/followsRouter");
const likesRouter = require("./routers/likesRouter");
const chatRouter = require("./routers/chatRouter");
const notificationRouter = require("./routers/notificationRouter");
const setupSockets = require("./sockets/socketHandler");
const { setSocketIO } = require("./utils/notify");
const { errorResponse } = require("./utils/errors");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

setSocketIO(io);

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
app.use("/family", familyRouter);
app.use(followsRouter);
app.use("/likes", likesRouter);
app.use("/chat", chatRouter);
app.use(notificationRouter);

setupSockets(io);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
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

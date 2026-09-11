require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const { apiLimiter } = require("./middleware/rateLimiter");

const authRouter = require("./modules/auth/authRouter");
const breedsRouter = require("./modules/breeds/breedsRouter");
const countriesRouter = require("./modules/countries/countriesRouter");
const photoRouter = require("./modules/photos/photoRouter");
const postRouter = require("./modules/posts/postRouter");
const postwallRouter = require("./modules/postwall/postwallRouter");
const commentRouter = require("./modules/comments/commentRouter");
const repostRouter = require("./modules/reposts/repostRouter");
const friendsRouter = require("./modules/friends/friendsRouter");
const familyRouter = require("./modules/family/familyRouter");
const followsRouter = require("./modules/follows/followsRouter");
const likesRouter = require("./modules/likes/likesRouter");
const chatRouter = require("./modules/chat/chatRouter");
const notificationRouter = require("./modules/notifications/notificationRouter");
const setupSockets = require("./sockets/socketHandler");
const { setSocketIO } = require("./utils/notify");
const { errorResponse } = require("./utils/errors");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: { origin: "*" },
});

setSocketIO(io);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(apiLimiter);
app.use(authRouter);
app.use("/breeds", breedsRouter);
app.use("/countries", countriesRouter);
app.use("/api/upload", photoRouter);
app.use("/posts", postRouter);
app.use("/postwall", postwallRouter);
app.use("/comments", commentRouter);
app.use("/reposts", repostRouter);
app.use("/friends", friendsRouter);
app.use("/family", familyRouter);
app.use(followsRouter);
app.use("/likes", likesRouter);
app.use("/chat", chatRouter);
app.use(notificationRouter);

setupSockets(io);

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json(errorResponse("INTERNAL_SERVER_ERROR"));
});

const start = async () => {
  if (!process.env.MONGO_URL) {
    console.error("MONGO_URL is not set in .env");
    process.exit(1);
  }
  if (!process.env.PORT) {
    console.error("PORT is not set in .env");
    process.exit(1);
  }
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is not set in .env");
    process.exit(1);
  }
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_SECRET_KEY
  ) {
    console.error(
      "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_SECRET_KEY must be set in .env",
    );
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URL);
    http.listen(process.env.PORT, () =>
      console.log(`Server started on port ${process.env.PORT}`),
    );
  } catch (err) {
    console.error("Failed to connect to MongoDB, server not started:", err);
    process.exit(1);
  }
};

start();

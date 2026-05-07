const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
const PORT = process.env.PORT || 3005;
const app = express();
const authRouter = require("./routers/authRouter");
const breedsRouter = require("./routers/breedsRouter");
const countriesRouter = require("./routers/countriesRouter");
const photoRouter = require("./routers/photoRouter");
const postRouter = require("./routers/postRouter");
const postwallRouter = require("./routers/postwallRouter");
const commentRouter = require("./routers/commentRouter");
const friendsRouter = require("./routers/friendsRouter");
const likesRouter = require("./routers/likesRouter");

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

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    app.listen(PORT, () => console.log(`server started on ${PORT}`));
  } catch (e) {
    console.error(e);
  }
};

start();

const { Schema, model } = require("mongoose");

const User = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      minlength: 3,
    },
    name: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    avatar: { type: String, default: null },
    avatarPhotos: [{ type: Schema.Types.ObjectId, ref: "Photo" }],
    bio: { type: String, maxLength: 150, default: null },
    sex: { type: String, default: null },
    birthDate: { type: Date, default: null },
    country: { type: String, default: null },
    city: { type: String, default: null },
    breed: { type: String, default: null },
    interests: {
      favoriteToys: { type: String, maxLength: 300, default: null },
      favoriteTreats: { type: String, maxLength: 300, default: null },
      favoriteActivities: { type: String, maxLength: 300, default: null },
      crimes: { type: String, maxLength: 300, default: null },
      guiltyHabits: { type: String, maxLength: 300, default: null },
      humans: { type: String, maxLength: 300, default: null },
    },
    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: null },

    photos: [{ type: Schema.Types.ObjectId, ref: "Photo" }],
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    followers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: Schema.Types.ObjectId, ref: "User" }],

    achievements: {
      firstFriend: { type: Boolean, default: false },
      firstPost: { type: Boolean, default: false },
    },
  },
  { toJSON: { virtuals: true } },
);

module.exports = model("User", User);

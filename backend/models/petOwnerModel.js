const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const petOwnerSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: function () {
        return !this.oauthProvider;
      },
    },
    oauthProvider: {
      type: String,
      enum: ["google", "facebook", "github"], 
      required: false,
    },
    oauthId: {
      type: String,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("petOwner", petOwnerSchema);

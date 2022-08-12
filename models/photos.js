const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let photoSchema = new Schema(
  {
    title: {
      type: String,
      require: true,
    },
    description: {
      type: String,
      require: true,
    },
    photo: {
      type: String,
      require: true,
    },
    userId: {
      type: String,
      require: true,
    },
    user: {
      type: String,
      require: true,
    },
  },
  { timestamps: true }
);

let photo = mongoose.model("Photo", photoSchema);
module.exports = photo;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let userSchema = new Schema({
  username: {
    type: String,
    require: true,
  },
  password: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
  },
  ekip: {
    type: String,
    require: true,
  },
  admin: {
    type: String,
    require: true,
  },
  artist: {
    type: String,
    require: true,
  },
  badges: {
    type: Array,
    require: true,
  },
  photo: {
    type: String,
    require: true,
  },
  about: {
    type: String,
    require: true,
  },
  token: {
    type: String,
    require: true,
  },
  theme: {
    type: String,
    require: true,
  },
  url:{
    type:String,
    require: true,
  }
});

let user = mongoose.model("User", userSchema);
module.exports = user;

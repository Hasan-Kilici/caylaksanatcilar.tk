const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let aboutSchema = new Schema({
  text:{
    type:String,
    require:true,
  }
})

let about = mongoose.model("About", aboutSchema);
module.exports = about;

const mongoose = require("mongoose");
const commentSchema = new mongoose.Schema(
  {
    //  who comment
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    // in which post , i comment
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "post",
    },
    // what i comment
    text: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("comment", commentSchema);

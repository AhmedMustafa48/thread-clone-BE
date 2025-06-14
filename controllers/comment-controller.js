const User = require("../models/user-model");
const Post = require("../models/post-model");
const Comment = require("../models/comment-model");

exports.addComment = async (req, res) => {
  try {
    // id of post to comment
    const { id } = req.params;
    // text to comment
    const { text } = req.body;

    if (!id) {
      return res.status(400).json({ msg: "Id is required!" });
    }
    if (!text) {
      return res.status(400).json({ msg: "No comment is added!" });
    }
    //  validate wheather post is available or not
    const postExists = await Post.findById(id);
    if (!postExists) {
      return res.status(400).json({ msg: "No such post!" });
    }
    const comment = new Comment({
      text,
      admin: req.user._id,
      post: postExists._id,
    });

    const newComment = await comment.save();
    await Post.findByIdAndUpdate(
      id,
      {
        $push: { comments: newComment._id },
      },
      { new: true }
    );
    await User.findByIdAndUpdate(
      // id of commenting user
      req.user._id,
      {
        $push: { replies: newComment._id },
      },
      { new: true }
    );
    res.status(200).json({ msg: "Commented!" });
  } catch (err) {
    res.status(400).json({ msg: "Error in add comment!", err: err.message });
  }
};

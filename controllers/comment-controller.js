const User = require("../models/user-model");
const Post = require("../models/post-model");
const Comment = require("../models/comment-model");
const { default: mongoose } = require("mongoose");

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

exports.deleteComment = async (req, res) => {
  try {
    // postId = "id of post", id="id of comment"
    const { postId, id } = req.params;
    if (!postId || !id) {
      return res.status(400).json({ msg: "Error in delete comment!" });
    }
    const postExists = await Post.findById(postId);
    if (!postExists) {
      return res.status(400).json({ msg: "No such post!" });
    }
    const commentExists = await Comment.findById(id);
    if (!commentExists) {
      return res.status(400).json({ msg: "No such comment!" });
    }
    const newId = new mongoose.Types.ObjectId(id);
    if (postExists.comments.includes(newId)) {
      const id1 = commentExists.admin._id.toString();
      const id2 = req.user._id.toString();
      if (id1 !== id2) {
        return res
          .status(400)
          .json({ msg: "You are not authorized to delete the comment!" });
      }
      await Post.findByIdAndUpdate(
        postId,
        {
          $pull: { comments: id },
        },
        { new: true }
      );
      await User.findByIdAndUpdate(
        req.user._id,
        {
          $pull: { replies: id },
        },
        { new: true }
      );
      await Comment.findByIdAndDelete(id);
      return res.status(201).json({ msg: "Comment deleted!" });
    }
    res.status(201).json({ msg: "This post does not include the comment" });
  } catch (err) {
    res.status(400).json({ msg: "Error in delete comment!" });
  }
};

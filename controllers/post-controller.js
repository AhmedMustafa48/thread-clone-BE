const User = require("../models/user-model");
const Post = require("../models/post-model");
const Comment = require("../models/comment-model");

const cloudinary = require("../config/cloudinary");
const formidable = require("formidable");

exports.addPost = async (req, res) => {
  try {
    const form = formidable({});
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ msg: "Error in form parsing!" });
      }
      const post = new Post();
      if (fields.text) {
        post.text = fields.text;
      }
      if (files.media) {
        const uploadedImage = await cloudinary.uploader.upload(
          files.media.filepath,
          { folder: "Threads_clone/Posts" }
        );
        if (!uploadedImage) {
          return res
            .status(400)
            .json({ msg: "Error while uplpoading image !" });
        }
        post.media = uploadedImage.secure_url;
        post.public_id = uploadedImage.public_id;
      }
      post.admin = req.user._id;
      const newPost = await post.save();

      await User.findByIdAndUpdate(
        req.user._id,
        { $push: { threads: newPost._id } },
        { new: true }
      );
      res.status(201).json({ msg: "Post created!", newPost });
    });
  } catch (err) {
    res.status(400).json({ msg: "Error in Add post!", err: err.message });
  }
};

//                                              All post
exports.allPost = async (req, res) => {
  try {
    const { page } = req.query;
    let pageNumber = page;
    if (!page || page === undefined) {
      pageNumber = 1;
    }
    const posts = await Post.find({})
      // latest post will show first
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * 3)
      .limit(3)
      .populate({ path: "admin", select: "-password" })
      //   without pasword
      .populate({ path: "likes", select: "-password" })
      .populate({
        path: "comments",
        populate: {
          path: "admin",
          model: "user",
        },
      });
    res.status(200).json({ msg: "post fetched!", posts });
  } catch (err) {
    res.status(400).json({ msg: "Error in all post!", err: err.message });
  }
};
//                                              Delete post
exports.deletePost = async (req, res) => {
  try {
    // id of post to delete
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Id is required!" });
    }
    const postExists = await Post.findById(id);
    if (!postExists) {
      return res.status(400).json({ msg: "Post not found!" });
    }
    // to make sure that only admin can del post not someone else
    const userId = req.user._id.toString();
    const adminId = postExists.admin._id.toString();

    if (userId !== adminId) {
      return res
        .status(400)
        .json({ msg: "You are not authorized to delete this post!" });
    }
    if (postExists.media) {
      await cloudinary.uploader.destroy(
        postExists.public_id,
        (error, result) => {
          console.log({ error, result });
        }
      );
    }
    await Comment.deleteMany({ _id: { $in: postExists.comments } });
    await User.updateMany(
      {
        $or: [{ threads: id }, { reposts: id }, { replies: id }],
      },
      {
        $pull: {
          thread: id,
          reposts: id,
          replies: id,
        },
      },
      { new: true }
    );

    await Post.findByIdAndDelete(id);
    res.status(200).json({ msg: "Post deleted!" });
  } catch (err) {
    res.status(400).json({ msg: "Error in delete post!", err: err.message });
  }
};
//                                              Like post
exports.likePost = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Id is required!" });
    }
    const post = await Post.findById(id);
    if (!post) {
      return res.status(400).json({ msg: "No such post!" });
    }
    // dislike
    if (post.likes.includes(req.user._id)) {
      await Post.findByIdAndUpdate(
        id,
        { $pull: { likes: req.user._id } },
        { new: true }
      );
      return res.status(201).json({ msg: "Post unliked!" });
    }
    //  like

    await Post.findByIdAndUpdate(
      id,
      { $push: { likes: req.user._id } },
      { new: true }
    );
    return res.status(201).json({ msg: "Post liked!" });
  } catch (err) {
    res.status(400).json({ msg: "Error in like post!", err: err.message });
  }
};

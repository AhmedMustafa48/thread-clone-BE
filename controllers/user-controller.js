const User = require("../models/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const formidable = require("formidable");
const cloudinary = require("../config/cloudinary");

//                                                                              SIGN IN controller
exports.signin = async (req, res) => {
  try {
    // access user data (username , email , password)
    const { userName, email, password } = req.body;
    if (!userName || !email || !password) {
      return res
        .status(400)
        .json({ msg: "Username , Email and Password are required" });
    }
    //  checking that user is exist or not
    const userExists = await User.findOne({ email });
    // if user exist
    if (userExists) {
      return res
        .status(400)
        .json({ msg: "User is already registered! please login" });
    }
    // if user not exist
    const hashPassword = await bcrypt.hash(password, 10);
    if (!hashPassword) {
      return res.status(400).json({
        msg: "Error in Password hashing",
      });
    }

    // Creating new user according model
    const user = new User({
      userName,
      email,
      password: hashPassword,
    });

    const result = await user.save();

    if (!result) {
      return res.status(400).json({ msg: "Error while saving user!" });
    }

    const accessToken = jwt.sign(
      { token: result._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    if (!accessToken) {
      return res.status(400).json({ msg: "Error while generating token!" });
    }

    res.cookie("token", accessToken, {
      //  stored for 30 days
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "none",
      secure: true,
      partitioned: true,
    });

    // Successful user signed in
    res
      .status(201)
      .json({ msg: `User Signed in Successfully! hello ${result?.userName}` });
  } catch (err) {
    res.status(400).json({ msg: "Error in signin!", err: err.message });
  }
};
//                                                                              LOGIN controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password are required!" });
    }

    const userExists = await User.findOne({ email });

    if (!userExists) {
      return res.status(400).json({ msg: "Please signin first!" });
    }
    const passwordMatched = await bcrypt.compare(password, userExists.password);

    if (!passwordMatched) {
      return res.status(400).json({ msg: "Incorrect credentials!" });
    }

    const accessToken = jwt.sign(
      { token: userExists._id },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    if (!accessToken) {
      return res.status(400).json({ msg: "Token not generated in login!" });
    }
    res.cookie("token", accessToken, {
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      partitioned: true,
    });

    res
      .status(200)
      .json({ success: true, msg: "User Logged in successfully!" });
  } catch (err) {
    res.status(400).json({ msg: "Error while login!", err: err.message });
  }
};
//                                                                              user details controller
exports.userDetails = async (req, res) => {
  try {
    const { id } = req.params();
    if (!id) {
      return res.status(400).json({ msg: "Id is required" });
    }
    const user = await User.findById(id)
      .select("-password")
      .populate("followers")
      .populate("replies")
      .populate({
        path: "threads",
        populate: [{ path: "likes" }, { path: "comments" }, { path: "admin" }],
      })
      .populate({ path: "replies", populate: { path: "admin" } })
      .populate({
        path: "reposts",
        populate: [{ path: "likes" }, { path: "comments" }, { path: "admin" }],
      });
    res.status(200).json({ msg: "User details fetched!", user });
  } catch (err) {
    res.status(400).json({ msg: "Errors in user details!", err: err.message });
  }
};
//                                                                              follow any user controller
exports.followUser = async (req, res) => {
  try {
    // const req.user._id
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Id is required" });
    }
    const userExists = await User.findById(id);

    if (!userExists) {
      return res.status(400).json({ msg: "User don't exist!" });
    }

    if (userExists.followers.includes(req.user._id)) {
      await User.findByIdAndUpdate(
        userExists._id,
        {
          $pull: { followers: req.user._id },
        },
        {
          new: true,
        }
      );
      return res.status(201).json({ msg: `Unfollowed ${userExists.userName}` });
    }
    await User.findByIdAndUpdate(
      userExists._id,
      {
        $push: { followers: req.user._id },
      },
      {
        new: true,
      }
    );
    return res.status(201).json({ msg: `Followed ${userExists.userName}` });
  } catch (err) {
    res
      .status(400)
      .json({ msg: "Error in Follow any user!", err: error.message });
  }
};

//                                                                              Update profile
exports.updateProfile = async (req, res) => {
  try {
    // is token authenticated or not , if yes then user found
    const userExists = await User.findById(req.user._id);
    if (!userExists) {
      return res.status(400).json({ msg: "No such user!" });
    }

    const form = formidable();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res.status(400).json({ msg: "Form parse error", err });
      }

      // 1) Update bio if provided
      if (fields.text) {
        await User.findByIdAndUpdate(
          req.user._id,
          { bio: fields.text },
          { new: true }
        );
      }

      // 2) Handle media upload
      if (files.media) {
        // delete old image
        if (userExists.public_id) {
          await cloudinary.uploader.destroy(userExists.public_id);
        }

        // upload into your folder
        const uploadOpts = {
          asset_folder: "Threads_clone/Profiles",
          public_id_prefix: "Threads_clone/Profiles",
          overwrite: true,
        };
        const uploadImage = await cloudinary.uploader.upload(
          files.media.filepath,
          uploadOpts
        );

        if (!uploadImage) {
          return res.status(400).json({ msg: "Upload failed" });
        }

        // save the new URL + public_id
        await User.findByIdAndUpdate(
          req.user._id,
          {
            profilePic: uploadImage.secure_url,
            public_id: uploadImage.public_id,
          },
          { new: true }
        );
      }

      // send response once everything’s done
      res.status(201).json({ msg: "Profile updated successfully!" });
    });
  } catch (err) {
    res.status(400).json({ msg: "Error in update profile!", err: err.message });
  }
};
//                                                                              Search User
exports.searchUser = async (req, res) => {
  try {
    const { query } = req.params;
    const users = await User.find({
      $or: [
        { userName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ],
    });
    res.status(200).json({ msg: "Searched!", users });
  } catch (err) {
    res.status(400).json({ msg: "Error in search user!", err: err.message });
  }
};

//                                                                              Logout
exports.logout = async (req, res) => {
  try {
    res.cookie("token", "", {
      maxAge: Date.now(),
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    res.status(201).json({ msg: "You logged out!" });
  } catch (err) {
    res.status(400).json({ msg: "Error in logout!" });
  }
};

//                                                                              My Info
exports.myInfo = async (req, res) => {
  try {
    res.status(200).json({ me: req.user });
  } catch (err) {
    res.status(400).json({ msg: "Error in my info!" });
  }
};

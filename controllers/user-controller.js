const User = require("../models/user-model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
    });

    // Successful user signed in
    res
      .status(201)
      .json({ msg: `User Signed in Successfully! hello ${result?.userName}` });
  } catch (err) {
    res.status(400).json({ msg: "Error in signin!", err: err.message });
  }
};

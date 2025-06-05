const User = require("../models/user-model");
const jwt = require("jsonwebtoken");

const auth = async (req, res) => {
  try {
  } catch (error) {
    return res.status(400).json({ msg: "Error in auth!", err: err.message });
  }
};

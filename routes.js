const express = require("express");
const {
  signin,
  login,
  userDetails,
  followUser,
  updateProfile,
  searchUser,
  logout,
  myInfo,
} = require("./controllers/user-controller");
const auth = require("./middleware/auth");

const router = express.Router();

// post request
router.post("/signin", signin);
router.post("/login", login);

router.get("/user/:id", auth, userDetails);

router.put("/user/follow/:id", auth, followUser);
router.put("/update", auth, updateProfile);
router.get("/users/search/:query", auth, searchUser);
router.post("/logout", auth, logout);
router.get("/me", auth, myInfo);

// const protected = async (req, res) => {
//   res.status(200).json(req.user);
// };
// router.get("/demo", auth, protected);

module.exports = router;

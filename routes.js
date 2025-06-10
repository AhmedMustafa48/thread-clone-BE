const express = require("express");
const {
  signin,
  login,
  userDetails,
  followUser,
} = require("./controllers/user-controller");
const auth = require("./middleware/auth");

const router = express.Router();

// post request
router.post("/signin", signin);
router.post("/login", login);
router.get("/user/:id", userDetails);

router.put("/user/follow/:id", auth, followUser);

// const protected = async (req, res) => {
//   res.status(200).json(req.user);
// };
// router.get("/demo", auth, protected);

module.exports = router;

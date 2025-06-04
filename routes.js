const express = require("express");
const { signin, login } = require("./controllers/user-controller");

const router = express.Router();

// post request
router.post("/signin", signin);
router.post("/login", login);

module.exports = router;

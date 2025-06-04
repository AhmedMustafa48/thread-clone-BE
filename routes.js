const express = require("express");
const { signin } = require("./controllers/user-controller");

const router = express.Router();

// post request
router.post("/signin", signin);

module.exports = router;

const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const router = require("./routes");

dotenv.config();

const app = express();

connectDB();
// below router import from routes file
app.use("", router);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server connected on port : ${port}`);
});

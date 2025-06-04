const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const router = require("./routes");

dotenv.config();

const app = express();

connectDB();
app.use(express.json());
// below router import from routes file
app.use("/api", router);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server connected on port : ${port}`);
});

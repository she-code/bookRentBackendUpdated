const express = require("express");
const dotenv = require("dotenv");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

dotenv.config({ path: "./.env" });

const authenticateJwt = require("./middelwares/auth");

//import routes
const userRouter = require("./routes/users");
const adminRouter = require("./routes/admins");
const categoryRouter = require("./routes/categories");
const bookRouter = require("./routes/books");
const rentRouter = require("./routes/rents");
const authRouter = require("./routes/auth");

//create application
const app = express();
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
//parse json
app.use(bodyParser.json({ limit: "1mb" }));
app.use(express.json());
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Serve static files from the "uploads" directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// create routes
app.get("/", (req, res) => {
  res.send("welcome to book rent website");
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/auth", authRouter);

app.use("/api/v1/admins", adminRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/rents", authenticateJwt, rentRouter);

module.exports = app;

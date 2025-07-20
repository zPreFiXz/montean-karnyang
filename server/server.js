const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const dotenv = require("dotenv");

dotenv.config();

const { readdirSync } = require("fs");
const handleError = require("./middlewares/error");

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 50,
//   message: "Too many requests from this IP",
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Security Middleware
app.use(helmet());
// app.use(limiter);

// Middleware
app.use(
  cors({
    origin: process.env.WEB_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "500kb" }));
app.use(express.urlencoded({ extended: true, limit: "500kb" }));
app.use(morgan("dev"));
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routing
readdirSync("./routes").map((r) => {
  app.use("/api", require("./routes/" + r));
});

// Error handling
app.use(handleError);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

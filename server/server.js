const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const csurf = require("csurf");
const dotenv = require("dotenv");

dotenv.config();

const { readdirSync } = require("fs");
const handleError = require("./middlewares/error");

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 50,
//   message: { error: "Too many requests, try again later." },
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
app.use(
  csurf({
    cookie: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// CSRF token endpoint
app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
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

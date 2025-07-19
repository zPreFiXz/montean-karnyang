const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();
const dotenv = require("dotenv");

dotenv.config();

const { readdirSync } = require("fs");
const handleError = require("./middlewares/error");

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

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

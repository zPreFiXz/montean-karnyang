const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const app = express();

const { readdirSync } = require("fs");

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

readdirSync("./routes").map((r) => {
  app.use("/api", require("./routes/" + r));
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

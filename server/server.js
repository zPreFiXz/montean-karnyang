const dotenv = require("dotenv");
dotenv.config(); // โหลด .env ก่อน require อื่น เผื่อโมดูลอ่าน env ตอน import

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { readdirSync } = require("fs");
const cookieParser = require("cookie-parser");
const handleError = require("./middlewares/error");

const app = express();

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// Routing
readdirSync("./routes").map((c) => app.use("/api", require("./routes/" + c)));

// Error handling
app.use(handleError);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

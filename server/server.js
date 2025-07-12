const express = require("express");
const cors = require("cors");
const app = express();

const vehicleRoutes = require("./routes/vehicle");

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api', vehicleRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

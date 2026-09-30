require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const courseRoutes = require("./routes/course.routes");
const registrationRoutes = require("./routes/registration.routes");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/registration", registrationRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "University Timetable & Clash Detection API is running",
    endpoints: {
      auth: "/api/auth",
      dashboard: "/api/dashboard/:studentId",
      courses: "/api/courses",
      registration: "/api/registration",
    },
  });
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
});

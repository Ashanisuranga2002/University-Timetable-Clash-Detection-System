require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const courseRoutes = require("./routes/course.routes");
const registrationRoutes = require("./routes/registration.routes");
const adminAuthRoutes = require("./routes/admin.auth.routes");
const adminRoutes = require("./routes/admin.routes");
const studentRequestRoutes = require("./routes/studentRequestRoutes");
const advisorReviewRoutes = require("./routes/advisorReviewRoutes");
const adminUserRoutes = require("./routes/admin.user.routes");
const adminMonitorRoutes = require("./routes/admin.monitor.routes");
const adminAlertRoutes = require("./routes/admin.alert.routes");
const adminSystemHealthRoutes = require("./routes/admin.systemHealth.routes");
const coordinatorRoutes = require("./routes/coordinator.routes");
const adminAuth = require("./middleware/adminAuth");

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/registration", registrationRoutes);
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/users", adminAuth, adminUserRoutes);
app.use("/api/admin/monitors", adminAuth, adminMonitorRoutes);
app.use("/api/admin/alerts", adminAuth, adminAlertRoutes);
app.use("/api/admin/system-health", adminAuth, adminSystemHealthRoutes);

app.use('/api/student-requests', studentRequestRoutes);
app.use('/api/advisor-reviews', advisorReviewRoutes);
app.use('/api/coordinator', coordinatorRoutes);

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

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Base API URL: http://localhost:${PORT}/api`);
  });
}

module.exports = app;

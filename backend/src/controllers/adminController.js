// ===============================================================
// Admin General Controller
// Handles admin dashboard stats, course administration, and system telemetry
// ===============================================================

const os = require("os");
const Course = require("../models/Course");
const Registration = require("../models/Registration");
const Student = require("../models/Student");
const User = require("../models/User");
const Monitor = require("../models/Monitor");
const Alert = require("../models/Alert");
const Clash = require("../models/Clash");

// ---------------------------------------------------------------
// Create Course: Adds a new academic course to the system
// ---------------------------------------------------------------
const createCourse = async (req, res) => {
  try {
    const {
      courseCode,
      courseName,
      credits,
      semester,
      type,
      lecturer,
      description,
      schedule,
      slots,
    } = req.body;

    // Validate required course fields
    if (!courseCode || !courseName || !credits || !semester || !type) {
      return res.status(400).json({
        success: false,
        message: "courseCode, courseName, credits, semester, and type are required",
      });
    }

    // Check if course with this code already exists
    const existing = await Course.findOne({ courseCode: courseCode.toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Course ${courseCode.toUpperCase()} already exists`,
      });
    }

    // Create and save the new course
    const course = await Course.create({
      courseCode: courseCode.toUpperCase(),
      courseName,
      credits: Number(credits),
      semester: Number(semester),
      type,
      lecturer: lecturer || "",
      description: description || "",
      schedule: schedule || [],
      slots: slots || [],
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create course",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------
// Update Course: Modifies details of an existing course
// ---------------------------------------------------------------
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Locate target course
    let course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Apply updates and save
    Object.assign(course, req.body);
    await course.save();

    res.status(200).json({ success: true, message: "Course updated", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------
// Delete Course: Soft-deletes (deactivates) a course
// ---------------------------------------------------------------
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    // Mark isActive as false instead of destroying the record
    const course = await Course.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    res.status(200).json({ success: true, message: "Course deactivated", course });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------
// Get Admin Dashboard: High-level counts for academic data
// ---------------------------------------------------------------
const getAdminDashboard = async (req, res) => {
  try {
    // Concurrently fetch counts and recent entries
    const [
      totalCourses,
      totalStudents,
      totalRegistrations,
      confirmedRegistrations,
      blockedRegistrations,
      draftRegistrations,
      coreCount,
      electiveCount,
      recentCourses,
      recentStudents,
    ] = await Promise.all([
      Course.countDocuments({ isActive: true }),
      Student.countDocuments(),
      Registration.countDocuments(),
      Registration.countDocuments({ status: "confirmed" }),
      Registration.countDocuments({ status: "blocked" }),
      Registration.countDocuments({ status: "draft" }),
      Course.countDocuments({ type: "Core", isActive: true }),
      Course.countDocuments({ type: "Elective", isActive: true }),
      Course.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).lean(),
      Student.find().sort({ createdAt: -1 }).limit(5).select("studentId name programme semester createdAt").lean(),
    ]);

    // Return academic summary
    res.status(200).json({
      success: true,
      stats: {
        totalCourses,
        totalStudents,
        totalRegistrations,
        confirmedRegistrations,
        blockedRegistrations,
        draftRegistrations,
        coreCount,
        electiveCount,
      },
      recentCourses,
      recentStudents,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error: error.message,
    });
  }
};

// ---------------------------------------------------------------
// Get All Courses: Returns list of courses with optional inactive flag
// ---------------------------------------------------------------
const getAllCoursesAdmin = async (req, res) => {
  try {
    const showAll = req.query.all === "true";
    const query = showAll ? {} : { isActive: true };

    const courses = await Course.find(query).sort({ createdAt: -1 }).lean();

    res.status(200).json({ success: true, count: courses.length, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------------------------------------------------------------
// Get Admin Dashboard Stats: Aggregated live operational telemetry
// Computes live counts, health states, average latency, and system load
// ---------------------------------------------------------------
const getAdminDashboardStats = async (req, res) => {
  try {
    // Run database queries in parallel for optimal performance
    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalMonitors,
      healthyMonitors,
      warningMonitors,
      criticalMonitors,
      offlineMonitors,
      totalAlerts,
      activeAlerts,
      criticalAlerts,
      acknowledgedAlerts,
      resolvedAlerts,
      totalClashes,
      activeClashes,
      totalCourses,
      monitorsList,
      recentAlertsList,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "Active" }),
      User.countDocuments({ status: { $in: ["Inactive", "Suspended"] } }),
      Monitor.countDocuments(),
      Monitor.countDocuments({ healthStatus: "Healthy", enabled: true }),
      Monitor.countDocuments({ healthStatus: "Warning", enabled: true }),
      Monitor.countDocuments({ healthStatus: "Critical", enabled: true }),
      Monitor.countDocuments({ $or: [{ healthStatus: "Offline" }, { enabled: false }] }),
      Alert.countDocuments(),
      Alert.countDocuments({ state: "active" }),
      Alert.countDocuments({ severity: "critical", state: { $ne: "resolved" } }),
      Alert.countDocuments({ state: "acknowledged" }),
      Alert.countDocuments({ state: "resolved" }),
      Clash.countDocuments(),
      Clash.countDocuments({ status: "active" }),
      Course.countDocuments({ isActive: true }),
      Monitor.find().sort({ createdAt: -1 }),
      Alert.find({ state: { $ne: "resolved" } }).sort({ createdAt: -1 }).limit(5),
    ]);

    // 1. Calculate overall system health based on active monitors
    const enabledMonitors = monitorsList.filter((m) => m.enabled);
    const totalEnabled = enabledMonitors.length;

    let healthPercentage = null;
    let healthStatus = "No Data";

    if (totalEnabled > 0) {
      healthPercentage = Math.round((healthyMonitors / totalEnabled) * 100);
      if (criticalMonitors > 0 || healthPercentage < 70) {
        healthStatus = "Critical";
      } else if (warningMonitors > 0 || activeAlerts > 2 || healthPercentage < 90) {
        healthStatus = "Warning";
      } else {
        healthStatus = "Healthy";
      }
    }

    // 2. Compute average latency across enabled monitors
    let totalLatency = 0;
    let latencyCount = 0;
    enabledMonitors.forEach((m) => {
      if (m.responseTime) {
        const match = m.responseTime.match(/([0-9.]+)/);
        if (match) {
          totalLatency += parseFloat(match[1]);
          latencyCount++;
        }
      }
    });

    const averageResponseTime =
      latencyCount > 0 ? (totalLatency / latencyCount).toFixed(2) + "s" : null;

    // 3. Collect host OS and Node.js process resource metrics
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsagePercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const loadAvg = os.loadavg()[0];
    const uptimeSec = Math.round(process.uptime());

    // Send complete aggregated dashboard payload
    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
        },
        monitors: {
          total: totalMonitors,
          healthy: healthyMonitors,
          warning: warningMonitors,
          critical: criticalMonitors,
          offline: offlineMonitors,
        },
        alerts: {
          total: totalAlerts,
          active: activeAlerts,
          critical: criticalAlerts,
          acknowledged: acknowledgedAlerts,
          resolved: resolvedAlerts,
        },
        clashes: {
          total: totalClashes,
          active: activeClashes,
          resolved: Math.max(0, totalClashes - activeClashes),
        },
        courses: {
          total: totalCourses,
        },
        systemHealth: {
          status: healthStatus,
          percentage: healthPercentage,
          averageResponseTime,
          server: os.hostname() || "AU-CAMPUS-CORE-01",
          uptimePercentage: healthPercentage !== null ? 99.9 : null,
          lastUpdated: new Date().toISOString(),
        },
        systemLoad: {
          memoryUsagePercentage: memUsagePercent,
          loadAverage: Number(loadAvg.toFixed(2)),
          uptimeSeconds: uptimeSec,
          processMemoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        },
        recentMonitors: monitorsList.slice(0, 4).map((m) => ({
          id: m.monitorId || m._id,
          name: m.serviceName,
          pod: `${m.serviceType} • ${m.interval}`,
          latency: m.responseTime || "--",
          status: m.enabled ? m.status : "offline",
          healthStatus: m.enabled ? m.healthStatus : "Offline",
          enabled: m.enabled,
        })),
        recentAlerts: recentAlertsList.map((a) => ({
          id: a.alertId || a._id,
          title: a.title,
          service: a.service,
          time: a.time,
          severity: a.severity,
          state: a.state,
          createdAt: a.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard stats",
      error: error.message,
    });
  }
};

// Export all general admin handlers
module.exports = {
  createCourse,
  updateCourse,
  deleteCourse,
  getAdminDashboard,
  getAdminDashboardStats,
  getAllCoursesAdmin,
};


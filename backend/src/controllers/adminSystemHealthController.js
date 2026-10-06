const User = require("../models/User");
const Monitor = require("../models/Monitor");
const Alert = require("../models/Alert");

// GET /api/admin/system-health
exports.getSystemHealth = async (req, res) => {
  try {
    const [totalUsers, activeUsers, monitors, activeAlertsCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: "Active" }),
      Monitor.find(),
      Alert.countDocuments({ state: { $ne: "resolved" } }),
    ]);

    const totalMonitors = monitors.length;
    const onlineMonitors = monitors.filter((m) => m.status === "online" && m.enabled).length;
    const warningMonitors = monitors.filter((m) => m.status === "warning" || m.healthStatus === "Warning").length;
    const criticalMonitors = monitors.filter((m) => m.status === "offline" || m.healthStatus === "Critical").length;

    let overallStatus = "Healthy";
    if (criticalMonitors > 0) {
      overallStatus = "Critical";
    } else if (warningMonitors > 0 || activeAlertsCount > 2) {
      overallStatus = "Warning";
    }

    // Average latency
    let totalLatency = 0;
    let latencyCount = 0;
    monitors.forEach((m) => {
      const match = m.responseTime?.match(/([0-9.]+)/);
      if (match) {
        totalLatency += parseFloat(match[1]);
        latencyCount++;
      }
    });
    const avgLatency = latencyCount > 0 ? (totalLatency / latencyCount).toFixed(1) + "s" : "1.2s";

    const mappedServices = monitors.map((m) => ({
      id: m.monitorId || m._id,
      name: m.serviceName,
      subtitle: m.serviceType,
      latency: m.responseTime || "1.0s",
      availability: m.status === "online" ? "99.98%" : "98.40%",
      status: m.status,
      note: m.description,
      pod: `${m.serviceType} • ${m.interval}`,
    }));

    const responseData = {
      overallStatus,
      server: "AU-CAMPUS-CORE-01",
      campus: "CAMPUS US-EAST",
      uptime: 99.98,
      nodesSync: 32,
      latencyMs: 8,
      averageResponseTime: avgLatency,
      totalUsers,
      activeUsers,
      totalMonitors,
      onlineMonitors,
      warningMonitors,
      criticalMonitors,
      activeAlerts: activeAlertsCount,
      services: mappedServices,
      lastUpdated: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

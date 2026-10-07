const os = require("os");
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

    // Average latency from real monitors
    let totalLatency = 0;
    let latencyCount = 0;
    monitors.forEach((m) => {
      const match = m.responseTime?.match(/([0-9.]+)/);
      if (match) {
        totalLatency += parseFloat(match[1]);
        latencyCount++;
      }
    });
    const avgLatency = latencyCount > 0 ? (totalLatency / latencyCount).toFixed(2) + "s" : "--";

    const mappedServices = monitors.map((m) => ({
      id: m.monitorId || m._id,
      name: m.serviceName,
      subtitle: m.serviceType,
      latency: m.responseTime || "--",
      availability: m.status === "online" ? "99.98%" : m.status === "warning" ? "98.40%" : "0.00%",
      status: m.status,
      healthStatus: m.healthStatus,
      enabled: m.enabled,
      note: m.description,
      pod: `${m.serviceType} • ${m.interval}`,
      lastChecked: m.lastChecked,
    }));

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);
    const heapUsedMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    const uptimePct = totalMonitors > 0 ? Number(((onlineMonitors / totalMonitors) * 100).toFixed(1)) : 100;

    const responseData = {
      overallStatus,
      server: os.hostname() || "AU-CAMPUS-CORE-01",
      campus: "CAMPUS MAIN",
      uptime: uptimePct,
      nodesSync: totalMonitors,
      latencyMs: latencyCount > 0 ? Math.round((totalLatency / latencyCount) * 1000) : 0,
      averageResponseTime: avgLatency,
      totalUsers,
      activeUsers,
      totalMonitors,
      onlineMonitors,
      warningMonitors,
      criticalMonitors,
      activeAlerts: activeAlertsCount,
      memoryPercent,
      heapUsedMB,
      services: mappedServices,
      lastUpdated: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, data: responseData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

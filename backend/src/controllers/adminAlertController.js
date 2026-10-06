const Alert = require("../models/Alert");

const INITIAL_ALERTS = [
  {
    alertId: "INC-2024-8841",
    title: "High Latency Spike in Conflict Engine",
    service: "Clash Detection Core",
    worker: "Worker 04",
    time: "2 mins ago",
    severity: "high",
    state: "active",
    metricLabel1: "P99 LATENCY",
    metricValue1: "4.8s",
    metricLabel2: "QUEUE DEPTH",
    metricValue2: "148 jobs",
    impactNote: "Course clash checks taking 4x baseline; 148 jobs in pending queue",
    resolvedNote: "Investigating thread starvation on node 04",
    ttr: "~12m remaining",
  },
  {
    alertId: "INC-2024-8839",
    title: "Deadlock Detected on Timetable Lock Row",
    service: "Database Primary",
    worker: "Cluster 01",
    time: "14 mins ago",
    severity: "critical",
    state: "active",
    metricLabel1: "BLOCKED QUERIES",
    metricValue1: "23",
    metricLabel2: "WAIT TIME",
    metricValue2: "8.2s",
    impactNote: "Concurrent registration transactions contending on semester lock",
    resolvedNote: "Connection pool autoscaling triggered",
    ttr: "~5m remaining",
  },
  {
    alertId: "INC-2024-8835",
    title: "Slow Query Execution on Elective Enrollments",
    service: "Course Indexer",
    worker: "Index Worker",
    time: "1 hour ago",
    severity: "medium",
    state: "monitoring",
    metricLabel1: "QUERY TIME",
    metricValue1: "2.1s",
    metricLabel2: "CPU LOAD",
    metricValue2: "78%",
    impactNote: "Elective course search filtering degraded for mobile clients",
    resolvedNote: "Applied partial index, monitoring query plan cache",
    ttr: "Stabilizing",
  },
  {
    alertId: "INC-2024-8820",
    title: "Gateway SSL Certificate Renewed",
    service: "Edge Proxy 04",
    worker: "Cert Manager",
    time: "3 hours ago",
    severity: "low",
    state: "resolved",
    metricLabel1: "EXPIRY",
    metricValue1: "90 days",
    metricLabel2: "HANDSHAKE",
    metricValue2: "12ms",
    impactNote: "Routine automated renewal completed with zero downtime",
    resolvedNote: "Verified all edge points responding with valid certificate",
    ttr: "Completed",
  },
];

async function ensureSeedAlerts() {
  const count = await Alert.countDocuments();
  if (count === 0) {
    await Alert.insertMany(INITIAL_ALERTS);
  }
}

// GET /api/admin/alerts
exports.getAlerts = async (req, res) => {
  try {
    await ensureSeedAlerts();
    const { status, severity } = req.query;
    const filter = {};

    if (status && status !== "all") {
      filter.state = status;
    }
    if (severity && severity !== "all") {
      filter.severity = severity;
    }

    const alerts = await Alert.find(filter).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: alerts.length, data: alerts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/alerts/:id
exports.getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { alertId: id }],
    });
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }
    return res.status(200).json({ success: true, data: alert });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/alerts/:id/status
exports.updateAlertStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { state, note } = req.body;

    const alert = await Alert.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { alertId: id }],
    });
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    if (state) alert.state = state;
    if (note) alert.resolvedNote = note;

    await alert.save();
    return res.status(200).json({ success: true, data: alert, message: `Alert status updated to ${state}` });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/alerts/:id
exports.deleteAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { alertId: id }],
    });
    if (!alert) {
      return res.status(404).json({ success: false, message: "Alert not found" });
    }

    await Alert.deleteOne({ _id: alert._id });
    return res.status(200).json({ success: true, message: "Alert dismissed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

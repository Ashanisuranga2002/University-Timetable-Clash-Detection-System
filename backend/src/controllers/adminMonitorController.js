const mongoose = require("mongoose");
const Monitor = require("../models/Monitor");
const Alert = require("../models/Alert");

const INITIAL_MONITORS = [
  {
    monitorId: "MON-01",
    serviceName: "Clash Detection Service",
    serviceType: "Engine",
    description: "Real-time timetable conflict detection engine",
    endpoint: "https://api.university.edu/clash-detection/health",
    interval: "15s",
    status: "online",
    healthStatus: "Healthy",
    enabled: true,
    responseTime: "1.2s",
  },
  {
    monitorId: "MON-02",
    serviceName: "Registration Service",
    serviceType: "Gateway",
    description: "Student course enrollment and registration ingress",
    endpoint: "https://api.university.edu/registration/health",
    interval: "30s",
    status: "online",
    healthStatus: "Healthy",
    enabled: true,
    responseTime: "1.5s",
  },
  {
    monitorId: "MON-03",
    serviceName: "Database Primary Cluster",
    serviceType: "Database",
    description: "High availability MongoDB database cluster",
    endpoint: "mongodb://cluster-core.internal:27017/status",
    interval: "10s",
    status: "online",
    healthStatus: "Healthy",
    enabled: true,
    responseTime: "0.8s",
  },
  {
    monitorId: "MON-04",
    serviceName: "Notification Service",
    serviceType: "Queue",
    description: "Event dispatch queue for timetable change notifications",
    endpoint: "https://queue.university.edu/sqs/health",
    interval: "60s",
    status: "warning",
    healthStatus: "Warning",
    enabled: true,
    responseTime: "2.4s",
  },
];

async function ensureSeedMonitors() {
  const count = await Monitor.countDocuments();
  if (count === 0) {
    await Monitor.insertMany(INITIAL_MONITORS);
  }
}

// Real health check probe executor for a monitor
async function executeProbe(monitor) {
  if (!monitor.enabled) {
    monitor.status = "offline";
    monitor.healthStatus = "Offline";
    monitor.lastChecked = new Date();
    await monitor.save();
    return monitor;
  }

  const startTime = Date.now();
  let isSuccess = false;
  let measuredDuration = null;
  let statusNote = "";

  // 1. Database Primary Cluster / MongoDB ping check
  if (
    monitor.serviceType === "Database" ||
    (monitor.endpoint && monitor.endpoint.startsWith("mongodb")) ||
    monitor.serviceName.toLowerCase().includes("database")
  ) {
    try {
      if (mongoose.connection.readyState === 1) {
        if (mongoose.connection.db) {
          await mongoose.connection.db.admin().ping();
        }
        measuredDuration = Date.now() - startTime;
        isSuccess = true;
      } else {
        isSuccess = false;
        statusNote = "MongoDB disconnected";
      }
    } catch (err) {
      isSuccess = false;
      statusNote = err.message;
    }
  }
  // 2. HTTP / HTTPS endpoints
  else if (
    monitor.endpoint &&
    (monitor.endpoint.startsWith("http://") || monitor.endpoint.startsWith("https://"))
  ) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(monitor.endpoint, {
        method: "HEAD",
        signal: controller.signal,
      }).catch(async () => {
        return await fetch(monitor.endpoint, {
          method: "GET",
          signal: controller.signal,
        });
      });

      clearTimeout(timeoutId);
      measuredDuration = Date.now() - startTime;

      if (res.status >= 200 && res.status < 400) {
        isSuccess = true;
      } else {
        isSuccess = false;
        statusNote = `HTTP ${res.status} ${res.statusText}`;
      }
    } catch (err) {
      measuredDuration = Date.now() - startTime;
      isSuccess = false;
      statusNote = err.name === "AbortError" ? "Connection timeout (3.5s)" : err.message;
    }
  }
  // 3. Internal Application Services
  else {
    measuredDuration = Date.now() - startTime;
    const heapUsed = process.memoryUsage().heapUsed;
    if (heapUsed > 0) {
      isSuccess = true;
    } else {
      isSuccess = false;
      statusNote = "Process resource unavailable";
    }
  }

  // Update response time and health status based on measured results
  if (measuredDuration !== null && isSuccess) {
    monitor.responseTime = (measuredDuration / 1000).toFixed(2) + "s";
    if (measuredDuration > 2000) {
      monitor.status = "warning";
      monitor.healthStatus = "Warning";
    } else {
      monitor.status = "online";
      monitor.healthStatus = "Healthy";
    }
  } else {
    monitor.responseTime = measuredDuration ? (measuredDuration / 1000).toFixed(2) + "s" : null;
    monitor.status = "offline";
    monitor.healthStatus = "Critical";
  }

  monitor.lastChecked = new Date();
  await monitor.save();

  // Alert correlation logic
  if (monitor.healthStatus === "Critical" || monitor.status === "offline") {
    const existingAlert = await Alert.findOne({
      service: monitor.serviceName,
      state: { $in: ["new", "active", "acknowledged", "monitoring"] },
    });

    if (!existingAlert) {
      await Alert.create({
        alertId: `INC-${Date.now().toString().slice(-4)}`,
        title: `${monitor.serviceName} Health Degradation Detected`,
        service: monitor.serviceName,
        worker: `${monitor.serviceType} Probe`,
        time: "Just now",
        severity: "critical",
        state: "active",
        metricLabel1: "RESPONSE TIME",
        metricValue1: monitor.responseTime || "Timeout",
        metricLabel2: "STATUS",
        metricValue2: monitor.healthStatus,
        impactNote: statusNote || `Service health check failed on probe target ${monitor.endpoint || 'internal'}`,
        monitorId: monitor._id,
      });
    } else {
      existingAlert.metricValue1 = monitor.responseTime || "Timeout";
      if (statusNote) existingAlert.impactNote = statusNote;
      existingAlert.updatedAt = new Date();
      await existingAlert.save();
    }
  } else if (monitor.healthStatus === "Healthy") {
    const existingActiveAlert = await Alert.findOne({
      service: monitor.serviceName,
      state: "active",
    });
    if (existingActiveAlert) {
      existingActiveAlert.state = "resolved";
      existingActiveAlert.resolvedNote = "Service recovered to Healthy state automatically";
      existingActiveAlert.resolvedAt = new Date();
      existingActiveAlert.ttr = "Auto-recovered";
      await existingActiveAlert.save();
    }
  }

  return monitor;
}

// GET /api/admin/monitors
exports.getMonitors = async (req, res) => {
  try {
    await ensureSeedMonitors();
    const monitors = await Monitor.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, count: monitors.length, data: monitors });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/admin/monitors/:id
exports.getMonitorById = async (req, res) => {
  try {
    const { id } = req.params;
    const monitor = await Monitor.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { monitorId: id }],
    });
    if (!monitor) {
      return res.status(404).json({ success: false, message: "Monitor not found" });
    }
    return res.status(200).json({ success: true, data: monitor });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/monitors
exports.createMonitor = async (req, res) => {
  try {
    const { monitorId, serviceName, serviceType, description, endpoint, interval, status, healthStatus, enabled } =
      req.body;

    if (!serviceName) {
      return res.status(400).json({ success: false, message: "Service name is required" });
    }

    const mId = monitorId?.trim() || `MON-${Date.now().toString().slice(-4)}`;

    const existing = await Monitor.findOne({ monitorId: mId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Monitor ID already exists" });
    }

    const monitor = await Monitor.create({
      monitorId: mId,
      serviceName: serviceName.trim(),
      serviceType: serviceType || "Service",
      description: description?.trim() || "",
      endpoint: endpoint?.trim() || "",
      interval: interval || "30s",
      status: status || "online",
      healthStatus: healthStatus || "Healthy",
      enabled: enabled !== undefined ? enabled : true,
      responseTime: "1.0s",
      lastChecked: new Date(),
    });

    return res.status(201).json({ success: true, data: monitor, message: "Monitor created successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/admin/monitors/:id
exports.updateMonitor = async (req, res) => {
  try {
    const { id } = req.params;
    const { serviceName, serviceType, description, endpoint, interval, status, healthStatus, enabled } = req.body;

    const monitor = await Monitor.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { monitorId: id }],
    });
    if (!monitor) {
      return res.status(404).json({ success: false, message: "Monitor not found" });
    }

    if (serviceName) monitor.serviceName = serviceName.trim();
    if (serviceType) monitor.serviceType = serviceType;
    if (description !== undefined) monitor.description = description.trim();
    if (endpoint !== undefined) monitor.endpoint = endpoint.trim();
    if (interval) monitor.interval = interval;
    if (status) monitor.status = status;
    if (healthStatus) monitor.healthStatus = healthStatus;
    if (enabled !== undefined) monitor.enabled = enabled;
    monitor.lastChecked = new Date();

    await monitor.save();
    return res.status(200).json({ success: true, data: monitor, message: "Monitor updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/admin/monitors/:id
exports.deleteMonitor = async (req, res) => {
  try {
    const { id } = req.params;
    const monitor = await Monitor.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { monitorId: id }],
    });
    if (!monitor) {
      return res.status(404).json({ success: false, message: "Monitor not found" });
    }

    await Monitor.deleteOne({ _id: monitor._id });
    return res.status(200).json({ success: true, message: "Monitor deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// PATCH /api/admin/monitors/:id/status
exports.updateMonitorStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, healthStatus, enabled } = req.body;

    const monitor = await Monitor.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { monitorId: id }],
    });
    if (!monitor) {
      return res.status(404).json({ success: false, message: "Monitor not found" });
    }

    if (status) monitor.status = status;
    if (healthStatus) monitor.healthStatus = healthStatus;
    if (enabled !== undefined) monitor.enabled = enabled;
    monitor.lastChecked = new Date();

    await monitor.save();
    return res.status(200).json({ success: true, data: monitor, message: "Monitor status updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/monitors/:id/check
exports.checkMonitor = async (req, res) => {
  try {
    const { id } = req.params;
    const monitor = await Monitor.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { monitorId: id }],
    });
    if (!monitor) {
      return res.status(404).json({ success: false, message: "Monitor not found" });
    }

    const updated = await executeProbe(monitor);
    return res.status(200).json({
      success: true,
      data: updated,
      message: `Probed ${updated.serviceName}: ${updated.healthStatus} (${updated.responseTime || "unresponsive"})`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/admin/monitors/check-all
exports.checkAllMonitors = async (req, res) => {
  try {
    const monitors = await Monitor.find();
    const updated = [];
    for (const m of monitors) {
      const resProbe = await executeProbe(m);
      updated.push(resProbe);
    }
    return res.status(200).json({
      success: true,
      count: updated.length,
      data: updated,
      message: `Successfully probed ${updated.length} monitors`,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

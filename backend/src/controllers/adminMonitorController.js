const Monitor = require("../models/Monitor");

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

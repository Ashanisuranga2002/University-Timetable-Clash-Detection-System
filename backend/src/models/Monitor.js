// ===============================================================
// Monitor Model - Mongoose Schema for Service Health Monitoring
// Stores monitoring endpoints, heartbeat intervals, and operational status
// ===============================================================

const mongoose = require("mongoose");

// Schema definition for tracked system services and infrastructure probes
const monitorSchema = new mongoose.Schema(
  {
    // Unique identifier for the monitor probe (e.g., MON-01)
    monitorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Name of the service being monitored (e.g., Clash Detection Service)
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    // Category of the service (Service, Database, Gateway, Queue, Engine, Worker)
    serviceType: {
      type: String,
      enum: ["Service", "Database", "Gateway", "Queue", "Engine", "Worker"],
      default: "Service",
    },
    // Brief description of service responsibilities
    description: {
      type: String,
      trim: true,
      default: "",
    },
    // URL or host endpoint pinged during health checks
    endpoint: {
      type: String,
      trim: true,
      default: "",
    },
    // Health probe ping frequency (e.g., '15s', '30s', '60s')
    interval: {
      type: String,
      default: "30s",
    },
    // High-level connectivity status: online, warning, or offline
    status: {
      type: String,
      enum: ["online", "warning", "offline"],
      default: "online",
    },
    // Detailed health status indicator: Healthy, Warning, Critical, Offline
    healthStatus: {
      type: String,
      enum: ["Healthy", "Warning", "Critical", "Offline"],
      default: "Healthy",
    },
    // Whether automated probing is active for this service
    enabled: {
      type: Boolean,
      default: true,
    },
    // Measured response latency (e.g., '1.2s')
    responseTime: {
      type: String,
      default: "1.2s",
    },
    // Timestamp when the last health check probe occurred
    lastChecked: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Automatically manage createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Export Monitor model
module.exports = mongoose.model("Monitor", monitorSchema);


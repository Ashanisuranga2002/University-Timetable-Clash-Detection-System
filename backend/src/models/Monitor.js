const mongoose = require("mongoose");

const monitorSchema = new mongoose.Schema(
  {
    monitorId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    serviceType: {
      type: String,
      enum: ["Service", "Database", "Gateway", "Queue", "Engine", "Worker"],
      default: "Service",
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    endpoint: {
      type: String,
      trim: true,
      default: "",
    },
    interval: {
      type: String,
      default: "30s",
    },
    status: {
      type: String,
      enum: ["online", "warning", "offline"],
      default: "online",
    },
    healthStatus: {
      type: String,
      enum: ["Healthy", "Warning", "Critical", "Offline"],
      default: "Healthy",
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    responseTime: {
      type: String,
      default: "1.2s",
    },
    lastChecked: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Monitor", monitorSchema);

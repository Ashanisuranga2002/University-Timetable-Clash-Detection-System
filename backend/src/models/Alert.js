// ===============================================================
// Alert Model - Mongoose Schema for System Incident Alerts
// Tracks operational issues, performance warnings, and resolution status
// ===============================================================

const mongoose = require("mongoose");

// Schema definition for system alerts / incident tracking
const alertSchema = new mongoose.Schema(
  {
    // Unique incident identifier (e.g., INC-2024-8841)
    alertId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    // Short headline describing the issue
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // The specific service or subsystem encountering the issue
    service: {
      type: String,
      required: true,
      trim: true,
    },
    // Server or cluster worker reporting the alert
    worker: {
      type: String,
      default: "Worker 01",
    },
    // Human-readable relative time representation (e.g., '2 mins ago')
    time: {
      type: String,
      default: "Just now",
    },
    // Severity level of the issue
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    // Workflow state of the alert
    state: {
      type: String,
      enum: ["new", "active", "acknowledged", "monitoring", "resolved"],
      default: "active",
    },
    // Primary telemetry metric label (e.g., 'P99 LATENCY')
    metricLabel1: { type: String, default: "" },
    // Primary telemetry metric value (e.g., '4.8s')
    metricValue1: { type: String, default: "" },
    // Secondary telemetry metric label (e.g., 'QUEUE DEPTH')
    metricLabel2: { type: String, default: "" },
    // Secondary telemetry metric value (e.g., '148 jobs')
    metricValue2: { type: String, default: "" },
    // Detailed note describing the user/system impact
    impactNote: { type: String, default: "" },
    // Notes added when investigating or fixing the issue
    resolvedNote: { type: String, default: "" },
    // Estimated or completed Time to Resolution (TTR)
    ttr: { type: String, default: "" },
    // Optional reference to a specific Monitor service
    monitorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Monitor",
      default: null,
    },
    // Timestamp when an administrator acknowledged the alert
    acknowledgedAt: { type: Date, default: null },
    // Timestamp when the alert was marked as resolved
    resolvedAt: { type: Date, default: null },
    // Name or ID of administrator who acknowledged
    acknowledgedBy: { type: String, default: "" },
    // Name or ID of administrator who resolved
    resolvedBy: { type: String, default: "" },
  },
  {
    // Automatically manage createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Export Alert model
module.exports = mongoose.model("Alert", alertSchema);


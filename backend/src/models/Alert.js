const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    service: {
      type: String,
      required: true,
      trim: true,
    },
    worker: {
      type: String,
      default: "Worker 01",
    },
    time: {
      type: String,
      default: "Just now",
    },
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    state: {
      type: String,
      enum: ["new", "active", "acknowledged", "monitoring", "resolved"],
      default: "active",
    },
    metricLabel1: { type: String, default: "" },
    metricValue1: { type: String, default: "" },
    metricLabel2: { type: String, default: "" },
    metricValue2: { type: String, default: "" },
    impactNote: { type: String, default: "" },
    resolvedNote: { type: String, default: "" },
    ttr: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Alert", alertSchema);

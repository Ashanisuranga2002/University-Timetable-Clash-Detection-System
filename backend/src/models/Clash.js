const mongoose = require("mongoose");

const clashSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        course1: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        course2: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: true,
        },

        day: {
            type: String,
            required: true,
            trim: true,
        },

        startTime: {
            type: String,
            required: true,
        },

        endTime: {
            type: String,
            required: true,
        },

        room1: {
            type: String,
            trim: true,
        },

        room2: {
            type: String,
            trim: true,
        },

        overlapMinutes: {
            type: Number,
            required: true,
            min: 0,
        },

        status: {
            type: String,
            enum: ["active", "resolved"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Clash", clashSchema);
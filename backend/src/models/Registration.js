const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Student",
            required: true,
        },

        courses: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Course",
            },
        ],

        totalCredits: {
            type: Number,
            default: 0,
        },

        status: {
            type: String,
            enum: ["draft", "confirmed", "blocked"],
            default: "draft",
        },

        academicYear: {
            type: String,
            required: true,
        },

        semester: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

registrationSchema.index({ student: 1, semester: 1 });

module.exports = mongoose.model("Registration", registrationSchema);
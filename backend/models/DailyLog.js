const mongoose = require("mongoose");

const DailyLogSchema = new mongoose.Schema(
    {
        studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
        internshipId: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
        mentorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter', required: true },

        date: { type: Date, required: true },
        dayNumber: Number, // Day 1, Day 2, etc. of internship

        // Work details
        tasksCompleted: [{
            description: String,
            hoursSpent: Number,
            status: { type: String, enum: ['completed', 'in-progress', 'blocked'] },
            githubLink: String,
            attachments: [String]
        }],

        totalHours: { type: Number, min: 1, max: 12 },

        // Learning & Challenges
        learnings: String,
        challenges: String,
        tomorrowPlan: String,

        // Mentor feedback
        mentorFeedback: {
            comment: String,
            rating: { type: Number, min: 1, max: 5 },
            suggestions: String,
            submittedAt: Date
        },

        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'needs-revision'],
            default: 'pending'
        },

        submittedAt: { type: Date, default: Date.now },
        reviewedAt: Date,

        weekNumber: Number,
        monthNumber: Number
    },
    { timestamps: true }
);

module.exports = mongoose.model("DailyLog", DailyLogSchema);

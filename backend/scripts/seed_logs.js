const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DailyLog = require('../models/DailyLog');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: '../.env' }); // Adjust if .env is not in the backend directory

const seedLogs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/internhub');
        console.log('MongoDB connected for seeding logs...');

        const logsRaw = fs.readFileSync(__dirname + '/zoyara_lavanya_logs.json', 'utf8');
        const logs = JSON.parse(logsRaw);

        // Optional: clear existing logs for this particular student & internship to prevent duplicates
        await DailyLog.deleteMany({ studentId: logs[0].studentId, internshipId: logs[0].internshipId });
        console.log(`Cleared existing logs for student ${logs[0].studentId} and internship ${logs[0].internshipId}`);

        const formattedLogs = logs.map(log => ({
            studentId: log.studentId,
            internshipId: log.internshipId,
            mentorId: log.mentorId,
            date: new Date(log.date),
            dayNumber: log.dayNumber,
            weekNumber: log.weekNumber,
            tasksCompleted: log.tasksCompleted,
            totalHours: log.totalHours,
            learnings: log.learnings,
            challenges: log.challenges,
            tomorrowPlan: log.tomorrowPlan,
            status: log.status === 'needs_revision' ? 'needs-revision' : log.status,
            mentorFeedback: {
                comment: log.mentorFeedback.comment,
                rating: log.mentorFeedback.rating,
                submittedAt: log.mentorFeedback.submittedAt ? new Date(log.mentorFeedback.submittedAt) : null
            },
            submittedAt: new Date(log.submittedAt),
            reviewedAt: log.reviewedAt ? new Date(log.reviewedAt) : null
        }));

        await DailyLog.insertMany(formattedLogs);
        console.log(`Successfully seeded ${formattedLogs.length} logs!`);
        process.exit();
    } catch (error) {
        console.error('Error seeding logs:', error);
        process.exit(1);
    }
};

seedLogs();

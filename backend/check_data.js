const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const Recruiter = require('./models/Recruiter');
        const Student = require('./models/Student');
        const Application = require('./models/Application');
        const DailyLog = require('./models/DailyLog');

        const recruiters = await Recruiter.find();
        console.log(`Found ${recruiters.length} recruiters`);

        for (const r of recruiters) {
            console.log(`\nRecruiter: ${r.fullName} (${r.email}) ID: ${r._id}`);
            console.log(`MentorFor count: ${r.mentorFor?.length || 0}`);
            
            const logsCount = await DailyLog.countDocuments({ mentorId: r._id });
            console.log(`Logs handled by this recruiter (mentorId): ${logsCount}`);

            // Also check logs by studentId
            const studentsInMentorFor = r.mentorFor || [];
            for (const sid of studentsInMentorFor) {
                const s = await Student.findById(sid);
                const sLogs = await DailyLog.countDocuments({ studentId: sid });
                console.log(`  - Student: ${s?.fullName || 'Unknown'} (${sid}) Logs: ${sLogs}`);
                
                const apps = await Application.find({ studentId: sid });
                apps.forEach(a => console.log(`      App ID: ${a._id} Status: ${a.status}`));
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkData();

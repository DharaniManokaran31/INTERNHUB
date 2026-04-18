const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: 'e:/InternHub/backend/.env' });

async function checkData() {
    try {
        await mongoose.connect('mongodb://localhost:27017/internhub');
        console.log('✅ Connected to MongoDB');

        const Recruiter = require('e:/InternHub/backend/models/Recruiter');
        const Student = require('e:/InternHub/backend/models/Student');
        const Application = require('e:/InternHub/backend/models/Application');
        const DailyLog = require('e:/InternHub/backend/models/DailyLog');

        const recruiters = await Recruiter.find();
        console.log(`Found ${recruiters.length} recruiters`);

        for (const r of recruiters) {
            console.log(`\nRecruiter: ${r.fullName} (${r.email}) ID: ${r._id}`);
            console.log(`MentorFor count: ${r.mentorFor?.length || 0}`);
            
            const logsCount = await DailyLog.countDocuments({ mentorId: r._id });
            console.log(`Logs handled by this recruiter: ${logsCount}`);

            if (r.mentorFor && r.mentorFor.length > 0) {
                for (const studentId of r.mentorFor) {
                    const student = await Student.findById(studentId);
                    console.log(`  - Mentee: ${student?.fullName || 'Unknown'} (${studentId})`);
                    
                    const apps = await Application.find({ studentId });
                    console.log(`    Applications found: ${apps.length}`);
                    apps.forEach(a => console.log(`      Status: ${a.status} ID: ${a._id}`));
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkData();

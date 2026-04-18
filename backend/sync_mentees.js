const mongoose = require('mongoose');
const Application = require('./models/Application');
const Recruiter = require('./models/Recruiter');

mongoose.connect('mongodb://127.0.0.1:27017/internhub').then(async () => {
    try {
        const apps = await Application.find({ status: { $in: ['accepted', 'completed'] } });
        console.log(`Found ${apps.length} total applications to process.`);
        
        for (const app of apps) {
            if (app.recruiterId) {
                const r = await Recruiter.findByIdAndUpdate(
                    app.recruiterId, 
                    { $addToSet: { mentorFor: app.studentId } },
                    { new: true }
                );
                if (r) {
                    console.log(`✅ Linked student ${app.studentId} to Recruiter ${r.fullName}`);
                }
            }
        }
        console.log('🎉 Retroactive mentee linking completed!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during sync:', error);
        process.exit(1);
    }
});

const mongoose = require('mongoose');
const Application = require('./backend/models/Application');
const Recruiter = require('./backend/models/Recruiter');
const Student = require('./backend/models/Student');
const Interview = require('./backend/models/Interview');

mongoose.connect('mongodb://127.0.0.1:27017/internhub').then(async () => {
    try {
        const acceptedApps = await Application.find({ status: 'accepted' });
        console.log(`Found ${acceptedApps.length} accepted applications.`);
        for (const app of acceptedApps) {
            await Recruiter.findByIdAndUpdate(app.recruiterId, { $addToSet: { mentorFor: app.studentId } });
            await Student.findByIdAndUpdate(app.studentId, { currentInternship: app.internshipId._id });
            await Interview.findOneAndUpdate({ applicationId: app._id }, { overallStatus: 'selected' });
        }
        console.log('Fixed retroactively!');
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
});

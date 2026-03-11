const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = "mongodb://localhost:27017/internships";

async function checkCounts() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to DB');

        const Recruiter = mongoose.model('Recruiter', new mongoose.Schema({ role: String }));
        const Internship = mongoose.model('Internship', new mongoose.Schema({ status: String }));
        const Application = mongoose.model('Application', new mongoose.Schema({ status: String }));
        const Student = mongoose.model('Student', new mongoose.Schema({}));

        const totalRecruiters = await Recruiter.countDocuments({ role: 'recruiter' });
        const hrCount = await Recruiter.countDocuments({ role: 'hr' });
        const activeInternships = await Internship.countDocuments({ status: 'active' });
        const totalApplicants = await Application.countDocuments({});
        const activeInterns = await Application.countDocuments({ status: 'accepted' });

        console.log({
            totalRecruiters,
            hrCount,
            activeInternships,
            totalApplicants,
            activeInterns
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkCounts();

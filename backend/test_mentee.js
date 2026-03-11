const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/internhub').then(async () => {
    require('./models/Company');
    require('./models/Student');
    const Recruiter = require('./models/Recruiter');
    const Internship = require('./models/Internship');
    const Application = require('./models/Application');

    try {
        const apps = await Application.find({ status: 'accepted' }).populate('internship');
        console.log('Total accepted applications:', apps.length);
        apps.forEach(app => {
            console.log('App internship id:', app.internship._id);
            console.log('App internship mentorId:', app.internship.mentorId);
            console.log('App internship postedBy:', app.internship.postedBy);
            console.log('App student:', app.student);
        });

    } catch (e) {
        console.error(e);
    }
    process.exit(0);
});

// backend/scripts/debugApplications.js
const mongoose = require('mongoose');
const Application = require('../models/Application');
const Student = require('../models/Student');
const Internship = require('../models/Internship');
require('dotenv').config();

const debugApplications = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Get all applications with student data
        const applications = await Application.find({})
            .populate('studentId')
            .populate('internshipId');

        console.log(`\n📊 Found ${applications.length} applications:\n`);

        applications.forEach((app, index) => {
            console.log(`=== Application ${index + 1} ===`);
            console.log(`Application ID: ${app._id}`);
            console.log(`Status: ${app.status}`);
            console.log(`Applied At: ${app.appliedAt}`);
            
            console.log(`\n👤 STUDENT DATA:`);
            if (app.studentId) {
                console.log(`   - ID: ${app.studentId._id}`);
                console.log(`   - Name: "${app.studentId.fullName || 'MISSING'}"`);
                console.log(`   - Email: "${app.studentId.email || 'MISSING'}"`);
                console.log(`   - College: "${app.studentId.currentEducation?.college || app.studentId.education?.college || 'MISSING'}"`);
                console.log(`   - Complete student object:`, JSON.stringify(app.studentId, null, 2));
            } else {
                console.log(`   ❌ NO STUDENT DATA FOUND!`);
            }
            
            console.log(`\n💼 INTERNSHIP DATA:`);
            if (app.internshipId) {
                console.log(`   - Title: "${app.internshipId.title}"`);
                console.log(`   - ID: ${app.internshipId._id}`);
            } else {
                console.log(`   ❌ NO INTERNSHIP DATA FOUND!`);
            }
            console.log('-------------------\n');
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

debugApplications();
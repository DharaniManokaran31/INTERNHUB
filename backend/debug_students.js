const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Student = require('./models/Student');

async function checkStudents() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internhub');
        console.log('Connected to MongoDB');

        const students = await Student.find({}).limit(10).lean();
        console.log(`Total students found: ${students.length}`);
        
        students.forEach((student, i) => {
            console.log(`\n--- Student ${i + 1} ---`);
            console.log(`ID: ${student._id}`);
            console.log(`fullName: ${student.fullName}`);
            console.log(`email: ${student.email}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkStudents();

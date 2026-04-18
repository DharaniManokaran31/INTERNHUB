const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Application = require('./models/Application');

async function checkApp() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internhub');
        console.log('Connected to MongoDB');

        const app = await Application.findById("69cde75243c525cde9284a6f").lean();
        console.log(`Application StudentId: ${app.studentId}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkApp();

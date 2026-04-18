const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Certificate = require('./models/Certificate');

async function checkCertificates() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internhub');
        console.log('Connected to MongoDB');

        const certs = await Certificate.find({}).limit(10).lean();
        console.log(`Total certificates found: ${certs.length}`);
        
        certs.forEach((cert, i) => {
            console.log(`\n--- Certificate ${i + 1} ---`);
            console.log(`ID: ${cert._id}`);
            console.log(`certificateId: ${cert.certificateId}`);
            console.log(`studentId: ${cert.studentId} (Type: ${typeof cert.studentId})`);
            console.log(`status: ${stat = cert.status}`);
            console.log(`applicationId: ${cert.applicationId}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkCertificates();

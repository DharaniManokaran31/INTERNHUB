const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const Certificate = require('./models/Certificate');

async function testQuery() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/internhub');
        console.log('Connected to MongoDB');

        const studentId = "69ba1d9af0d352e966a5894d";
        console.log(`Searching for studentId: ${studentId}`);

        const certs = await Certificate.find({ 
          studentId: new mongoose.Types.ObjectId(studentId), 
          status: 'issued' 
        });

        console.log(`✅ [OBJECTID QUERY] Found: ${certs.length}`);

        const stringCerts = await Certificate.find({ 
          studentId: studentId, 
          status: 'issued' 
        });

        console.log(`✅ [STRING QUERY] Found: ${stringCerts.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

testQuery();

const mongoose = require('mongoose');

const MONGO_URI = "mongodb://127.0.0.1:27017/internhub";

async function checkInternships() {
    try {
        await mongoose.connect(MONGO_URI);
        const Internship = mongoose.model('Internship', new mongoose.Schema({}, { strict: false }));
        const list = await Internship.find({}, { _id: 1, title: 1 });
        console.log('Internships found:', list);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkInternships();

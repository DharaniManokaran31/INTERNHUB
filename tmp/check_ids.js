const mongoose = require('mongoose');

const MONGO_URI = "mongodb://127.0.0.1:27017/internhub";

async function checkIds() {
    try {
        await mongoose.connect(MONGO_URI);
        
        const Internship = mongoose.model('Internship', new mongoose.Schema({ title: String }, { strict: false }));
        const Application = mongoose.model('Application', new mongoose.Schema({ student: { type: mongoose.Schema.Types.ObjectId } }, { strict: false }));
        
        const internships = await Internship.find({}, { _id: 1, title: 1 });
        console.log('\n--- INTERNSHIPS ---');
        internships.forEach(i => console.log(i._id.toString(), i.title));

        const applications = await Application.find({}, { _id: 1, student: 1 });
        console.log('\n--- APPLICATIONS ---');
        applications.forEach(a => console.log(a._id.toString(), a.student ? a.student.toString() : 'No Student'));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
checkIds();

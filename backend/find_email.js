const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const Student = require('./models/Student');
const Recruiter = require('./models/Recruiter');
const dotenv = require('dotenv');

dotenv.config();

const findEmailEverywhere = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'admin@zoyaraa.com';
    
    const [admin, student, recruiter] = await Promise.all([
      Admin.findOne({ email }),
      Student.findOne({ email }),
      Recruiter.findOne({ email })
    ]);
    
    console.log(`Results for ${email}:`);
    console.log('- Admin:', admin ? 'YES' : 'NO');
    console.log('- Student:', student ? 'YES' : 'NO');
    console.log('- Recruiter:', recruiter ? 'YES' : 'NO');
    
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
};

findEmailEverywhere();

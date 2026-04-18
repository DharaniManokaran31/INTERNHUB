const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const dotenv = require('dotenv');

dotenv.config();

const checkAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to:', process.env.MONGO_URI);
    
    const admins = await Admin.find({}, { password: 1, email: 1, fullName: 1 });
    console.log('Admins found:', admins.length);
    admins.forEach(a => {
      console.log(`- ${a.email} (${a.fullName})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
};

checkAdmins();

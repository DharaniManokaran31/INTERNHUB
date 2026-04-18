const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const resetPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const admins = await Admin.find({});
    
    for (const admin of admins) {
      let newPass = '';
      if (admin.email === 'admin@zoyaraa.com') newPass = 'Dharu@2005';
      else if (admin.email === 'admin@internhub.com') newPass = 'admin123';
      
      if (newPass) {
        const hashedPassword = await bcrypt.hash(newPass, 10);
        await Admin.updateOne({ _id: admin._id }, { password: hashedPassword });
        console.log(`✅ Reset password for ${admin.email} to ${newPass}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
};

resetPasswords();

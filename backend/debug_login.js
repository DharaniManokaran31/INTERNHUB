const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const debugLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const email = 'admin@zoyaraa.com';
    const password = 'Dharu@2005';
    
    const admin = await Admin.findOne({ email }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin NOT found in DB');
      return;
    }
    
    console.log('✅ Admin found');
    console.log('   Full Name:', admin.fullName);
    console.log('   Is Active:', admin.isActive);
    
    const isMatched = await bcrypt.compare(password, admin.password);
    console.log('   Password Match:', isMatched);
    
    if (!isMatched) {
      console.log('   Actual Hash in DB:', admin.password);
      const testHash = await bcrypt.hash(password, 10);
      console.log('   Hash of "Dharu@2005" now:', testHash);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
};

debugLogin();

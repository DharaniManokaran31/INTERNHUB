// backend/reset-password.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/internhub');
    
    const password = 'Dhara@2005';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    
    const result = await mongoose.connection.db
      .collection('recruiters')
      .updateOne(
        { email: 'dharani31082005@gmail.com' },
        { $set: { password: hash } }
      );
    
    console.log('Password reset successfully!', result);
    process.exit();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetPassword();
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const Student = require('./models/Student');
    const student = await Student.findOne(
      { email: 'dharani31082005@gmail.com' },
      { resetPasswordToken: 1, resetPasswordExpires: 1, password: 1 }
    );
    console.log('Reset Token (should be undefined):', student?.resetPasswordToken);
    console.log('Reset Expires (should be undefined):', student?.resetPasswordExpires);
    console.log('Password updated (hashed):', student?.password ? 'YES' : 'NO');
    mongoose.disconnect();
  })
  .catch(console.error);

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const Student = require('./models/Student');
    const student = await Student.findOne(
      { email: 'dharani31082005@gmail.com' },
      { resetPasswordToken: 1, resetPasswordExpires: 1 }
    );
    console.log('Reset Token:', student?.resetPasswordToken);
    console.log('Expires:', student?.resetPasswordExpires);
    mongoose.disconnect();
  })
  .catch(console.error);

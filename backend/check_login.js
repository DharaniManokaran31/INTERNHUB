const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' }); // Load .env
const Recruiter = require('./models/Recruiter');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        const user = await Recruiter.findOne({ email: 'dharani31082005@gmail.com' });
        const fs = require('fs');
        const output = {
            found: !!user,
            role: user ? user.role : null,
            isActive: user ? user.isActive : null,
            pwValid: user ? await bcrypt.compare('Dhara@2005', user.password) : null,
            hash: user ? user.password : null
        };
        fs.writeFileSync('db_test_result.json', JSON.stringify(output, null, 2));
        mongoose.disconnect();
    })
    .catch(console.error);

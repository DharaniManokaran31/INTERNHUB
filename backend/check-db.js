const mongoose = require('mongoose');
const Company = require('./models/Company');
const Recruiter = require('./models/Recruiter');
const dotenv = require('dotenv');

dotenv.config();

const check = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    const company = await Company.findOne({});
    console.log('Company:', company);
    const hr = await Recruiter.findOne({ role: 'hr' });
    console.log('HR User:', hr);
    await mongoose.disconnect();
};

check();

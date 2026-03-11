// backend/scripts/createAdmin.js
// Run with: node backend/scripts/createAdmin.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Admin = require('../models/Admin');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/internhub';

const ADMIN_DATA = {
  fullName: 'Dharani Manokaran',
  email: 'admin@zoyaraa.com',
  password: 'Admin@123',
  role: 'admin'
};

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existing = await Admin.findOne({ email: ADMIN_DATA.email });
    if (existing) {
      console.log(`⚠️  Admin already exists with email: ${ADMIN_DATA.email}`);
      console.log(`    Name: ${existing.fullName}`);
      console.log(`    Role: ${existing.role}`);
      console.log('');
      console.log('🔑 Login credentials:');
      console.log(`    Email:    ${ADMIN_DATA.email}`);
      console.log(`    Password: ${ADMIN_DATA.password}`);
      console.log('    URL:      http://localhost:3000/login (select Admin)');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, 10);

    // Create admin
    const admin = new Admin({
      fullName: ADMIN_DATA.fullName,
      email: ADMIN_DATA.email,
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();

    console.log('');
    console.log('🎉 Admin created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`    Name:     ${ADMIN_DATA.fullName}`);
    console.log(`    Email:    ${ADMIN_DATA.email}`);
    console.log(`    Password: ${ADMIN_DATA.password}`);
    console.log(`    Role:     admin`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔗 Login at: http://localhost:3000/login');
    console.log('   → Select "Admin" tab on the login page');
    console.log('');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();

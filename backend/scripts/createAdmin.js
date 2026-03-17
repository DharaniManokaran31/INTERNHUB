/**
 * CREATE SUPER ADMIN SCRIPT
 * Run this once to set up your first admin
 * Command: node scripts/createAdmin.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import Admin model
const Admin = require('../models/Admin');

// Admin details - YOU CAN CHANGE THESE
const ADMIN_DATA = {
  fullName: 'Bharani',
  email: 'admin@zoyaraa.com',
  password: 'Dharu@2005',  // Change this if you want
  phone: '9344848560',
  isSuperAdmin: true
};

const createAdmin = async () => {
  console.log('\n🚀 STARTING ADMIN CREATION...\n');

  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/internhub';
    await mongoose.connect(mongoURI);
    
    console.log('✅ Connected to MongoDB successfully!');
    console.log('📊 Database:', mongoURI.split('/').pop());

    // Check if any admin already exists
    console.log('\n🔍 Checking for existing admins...');
    const existingAdmin = await Admin.findOne();
    
    if (existingAdmin) {
      console.log('⚠️  Admin already exists in database!');
      console.log('\n📋 Existing Admin Details:');
      console.log('   Name:', existingAdmin.fullName);
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.isSuperAdmin ? 'Super Admin' : 'Regular Admin');
      
      console.log('\n❌ Cannot create another admin via script.');
      console.log('📝 To create additional admins, use the API later');
      
      process.exit(0);
    }

    console.log('✅ No existing admin found. Proceeding...\n');

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_DATA.password, salt);
    console.log('✅ Password hashed successfully');

    // Set permissions for super admin
    const permissions = {
      canManageUsers: true,
      canManageInternships: true,
      canManageRecruiters: true,
      canManageHR: true,
      canViewReports: true,
      canManageCompany: true
    };

    // Create admin object - NO PRE-SAVE HOOK to cause issues
    const admin = new Admin({
      fullName: ADMIN_DATA.fullName,
      email: ADMIN_DATA.email,
      password: hashedPassword,
      phone: ADMIN_DATA.phone,
      isSuperAdmin: ADMIN_DATA.isSuperAdmin,
      role: 'admin',
      permissions: permissions // Set permissions directly
    });

    // Save to database
    console.log('💾 Saving admin to database...');
    await admin.save();
    
    console.log('\n🎉 ✅ SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('📧 Email:', ADMIN_DATA.email);
    console.log('🔑 Password:', ADMIN_DATA.password);
    console.log('👤 Name:', ADMIN_DATA.fullName);
    console.log('👑 Role: Super Admin (Full Access)');
    console.log('==========================================\n');

    console.log('⚠️  IMPORTANT: Save these credentials securely!\n');

  } catch (error) {
    console.error('\n❌ ERROR CREATING ADMIN:');
    console.error('   Message:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack);
    }
  } finally {
    // Close database connection
    console.log('\n📡 Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('✅ Disconnected successfully');
    process.exit(0);
  }
};

// Run the function
createAdmin();
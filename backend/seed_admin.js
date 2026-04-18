const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin');
const dotenv = require('dotenv');

dotenv.config({ path: './.env' });

const createAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/internship_portal';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const adminEmail = 'admin@internhub.com';
    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists');
    } else {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const newAdmin = new Admin({
        fullName: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isSuperAdmin: true,
        permissions: {
          canManageUsers: true,
          canManageInternships: true,
          canManageRecruiters: true,
          canManageHR: true,
          canViewReports: true,
          canManageCompany: true
        }
      });
      await newAdmin.save();
      console.log('Super Admin created successfully');
      console.log('Email: admin@internhub.com');
      console.log('Password: admin123');
    }
  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    process.exit();
  }
};

createAdmin();

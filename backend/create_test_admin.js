const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const createTestAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const email = 'test@admin.com';
    const password = 'admin123';
    
    await Admin.deleteOne({ email });
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({
      fullName: 'Test Admin',
      email,
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
    
    await admin.save();
    console.log(`✅ Test Admin Created: ${email} / ${password}`);
    
  } catch (error) {
    console.error(error);
  } finally {
    process.exit();
  }
};

createTestAdmin();

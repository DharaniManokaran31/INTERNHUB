const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const recreateAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    // 1. Delete all existing admins
    const deleteResult = await Admin.deleteMany({});
    console.log(`✅ Deleted ${deleteResult.deletedCount} existing admin(s)`);
    
    // 2. Hash the password
    const password = 'Dharu@2005';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 3. Create fresh admin data
    const newAdmin = new Admin({
      fullName: 'Bharani',
      email: 'admin@zoyaraa.com',
      password: hashedPassword,
      phone: '9344848560',
      role: 'admin',
      isSuperAdmin: true,
      permissions: {
        canManageUsers: true,
        canManageInternships: true,
        canManageRecruiters: true,
        canManageHR: true,
        canViewReports: true,
        canManageCompany: true
      },
      isActive: true
    });
    
    await newAdmin.save();
    
    console.log('\n🎉 ✅ FRESH SUPER ADMIN CREATED SUCCESSFULLY!');
    console.log('==========================================');
    console.log('📧 Email: admin@zoyaraa.com');
    console.log('🔑 Password: Dharu@2005');
    console.log('👤 Name: Bharani');
    console.log('👑 Role: Super Admin (Full Access)');
    console.log('==========================================\n');
    
  } catch (error) {
    console.error('Error during admin recreation:', error);
  } finally {
    process.exit();
  }
};

recreateAdmin();

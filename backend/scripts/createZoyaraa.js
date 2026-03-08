const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
const Company = require('../models/Company');
const Recruiter = require('../models/Recruiter');

const createZoyaraa = async () => {
  try {
    console.log('🚀 Starting Zoyaraa setup...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Check if company already exists
    const existingCompany = await Company.findOne({});
    if (existingCompany) {
      console.log('❌ Zoyaraa company already exists!');
      console.log('Company details:', existingCompany);
      process.exit(1);
    }

    // Create HR Admin (with role 'hr')
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const hrAdmin = new Recruiter({
      fullName: 'HR Admin',
      email: 'hr@zoyaraa.com',
      password: hashedPassword,
      role: 'hr',  // 👑 This is the HR!
      company: 'Zoyaraa',
      position: 'HR Manager',
      phone: '+91 9876543210',
      
      // Zoyaraa specific fields
      companyId: null, // Will update after company creation
      permissions: {
        canPostInternship: false,
        canInviteRecruiters: true,
        canPublishCertificates: true,
        canViewAllDepartments: true,
        departmentOnly: false,
        maxInterns: 0
      }
    });
    
    await hrAdmin.save();
    console.log('✅ HR Admin created:');
    console.log('   Email: hr@zoyaraa.com');
    console.log('   Password: admin123');

    // Create Zoyaraa Company
    const company = new Company({
      name: 'Zoyaraa',
      email: 'hr@zoyaraa.com',
      phone: '+91 9876543210',
      website: 'https://zoyaraa.com',
      address: 'Chennai, India',
      description: 'India\'s fastest growing tech company',
      hrId: hrAdmin._id,
      verificationStatus: 'verified', // Auto-verified
      verifiedAt: new Date()
    });
    
    await company.save();
    console.log('✅ Zoyaraa company created!');

    // Update HR Admin with companyId
    hrAdmin.companyId = company._id;
    await hrAdmin.save();
    console.log('✅ HR Admin linked to company');

    console.log('\n🎉🎉🎉 ZOYARAA SETUP COMPLETE! 🎉🎉🎉');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 COMPANY DETAILS:');
    console.log(`   Name: ${company.name}`);
    console.log(`   ID: ${company._id}`);
    console.log(`   Status: ${company.verificationStatus}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 HR ADMIN LOGIN:');
    console.log('   Email: hr@zoyaraa.com');
    console.log('   Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📝 Next steps:');
    console.log('   1. HR can login at /login');
    console.log('   2. Go to /hr/dashboard');
    console.log('   3. Invite recruiters');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error during setup:', error);
    process.exit(1);
  }
};

createZoyaraa();
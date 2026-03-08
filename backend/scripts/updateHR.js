const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Update HR Admin
    const hashedPassword = await bcrypt.hash('Dharu@2005', 10);
    const updateResult = await mongoose.connection.db.collection('recruiters').updateOne(
      { email: 'hr@zoyaraa.com' },
      {
        $set: {
          email: 'dharani31082005@gmail.com',
          password: hashedPassword,
          fullName: 'Dharani',
          role: 'hr'
        }
      }
    );
    
    console.log('✅ HR Admin updated:', updateResult.modifiedCount > 0 ? 'Yes' : 'No');
    
    // Find the updated HR
    const hr = await mongoose.connection.db.collection('recruiters').findOne({ 
      email: 'dharani31082005@gmail.com' 
    });
    
    if (hr) {
      // Update company HR ID
      const companyUpdate = await mongoose.connection.db.collection('companies').updateOne(
        {},
        { $set: { hrId: hr._id } }
      );
      console.log('✅ Company HR ID updated:', companyUpdate.modifiedCount > 0 ? 'Yes' : 'No');
      
      console.log('\n✅ HR Admin updated successfully!');
      console.log('📧 New email: dharani31082005@gmail.com');
      console.log('🔑 New password: Dharu@2005');
    } else {
      console.log('❌ Could not find updated HR admin');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
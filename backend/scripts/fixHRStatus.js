const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB');
    
    // Update HR to accepted
    const result = await mongoose.connection.db.collection('recruiters').updateOne(
      { email: 'dharani31082005@gmail.com' },
      {
        $set: {
          invitationStatus: 'accepted',
          isInvited: false
        }
      }
    );
    
    console.log('✅ HR updated:', result.modifiedCount > 0 ? 'Yes' : 'No');
    
    // Verify
    const hr = await mongoose.connection.db.collection('recruiters').findOne({
      email: 'dharani31082005@gmail.com'
    });
    
    console.log('📊 Current status:', hr?.invitationStatus);
    console.log('📊 Is invited:', hr?.isInvited);
    
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
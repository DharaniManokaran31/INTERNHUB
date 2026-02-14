import { sendEmail, sendWelcomeEmail } from './utils/emailSender.mjs';

async function testEmailFunctions() {
  console.log('Testing email functions...\n');
  
  // Test 1: Basic email
  console.log('1. Sending basic email...');
  const result1 = await sendEmail(
    'dharani31082005@gmail.com',
    'Test from InternHub Utils',
    '<p>This is a test using our new <strong>reusable function</strong>!</p>'
  );
  console.log('Result:', result1.success ? '✅ Success' : '❌ Failed');
  
  // Test 2: Welcome email
  console.log('\n2. Sending welcome email...');
  const result2 = await sendWelcomeEmail(
    'dharani31082005@gmail.com',
    'Dharani'
  );
  console.log('Result:', result2.success ? '✅ Success' : '❌ Failed');
  
  console.log('\n✅ All tests completed! Check your email inbox.');
}

testEmailFunctions();
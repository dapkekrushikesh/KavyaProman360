// Quick Diagnostic Test for Forgot Password 500 Error
// Run this with: node test-forgot-password.js

require('dotenv').config();

console.log('\n🔍 Forgot Password Diagnostic Test\n');
console.log('=' .repeat(50));

// Test 1: Check if .env is loaded
console.log('\n1. Checking if .env file is loaded...');
if (process.env.NODE_ENV !== undefined || process.env.PORT !== undefined) {
  console.log('✅ .env file is being loaded');
} else {
  console.log('❌ .env file might not be loaded properly');
}

// Test 2: Check Brevo API Key
console.log('\n2. Checking Brevo API Key...');
if (process.env.BREVO_API_KEY) {
  const key = process.env.BREVO_API_KEY;
  console.log(`✅ BREVO_API_KEY found: ${key.substring(0, 15)}...${key.substring(key.length - 10)}`);
} else {
  console.log('❌ BREVO_API_KEY not found in environment variables');
  console.log('   Add it to backend/.env file');
}

// Test 3: Check Brevo From Email
console.log('\n3. Checking Brevo Sender Email...');
if (process.env.BREVO_FROM_EMAIL) {
  console.log(`✅ BREVO_FROM_EMAIL found: ${process.env.BREVO_FROM_EMAIL}`);
} else {
  console.log('❌ BREVO_FROM_EMAIL not found');
  console.log('   Add it to backend/.env file');
}

// Test 4: Check Frontend URL
console.log('\n4. Checking Frontend URL...');
if (process.env.FRONTEND_URL) {
  console.log(`✅ FRONTEND_URL found: ${process.env.FRONTEND_URL}`);
} else {
  console.log('⚠️  FRONTEND_URL not found (will use default)');
  console.log('   Recommended: Add FRONTEND_URL to backend/.env');
}

// Test 5: Check MongoDB Connection
console.log('\n5. Checking MongoDB URI...');
if (process.env.MONGO_URI) {
  console.log(`✅ MONGO_URI found: ${process.env.MONGO_URI.substring(0, 30)}...`);
} else {
  console.log('❌ MONGO_URI not found');
}

// Test 6: Test Brevo API Connection
console.log('\n6. Testing Brevo API connection...');
if (process.env.BREVO_API_KEY && process.env.BREVO_FROM_EMAIL) {
  const axios = require('axios');
  
  const testEmail = {
    sender: {
      email: process.env.BREVO_FROM_EMAIL,
      name: 'KavyaProman360 Test'
    },
    to: [{ email: process.env.BREVO_FROM_EMAIL }], // Send to self for testing
    subject: 'Test Email - Forgot Password Diagnostic',
    htmlContent: '<html><body><h1>Test Email</h1><p>If you receive this, Brevo is working correctly!</p></body></html>'
  };

  axios.post('https://api.brevo.com/v3/smtp/email', testEmail, {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log(`✅ Brevo API test successful! Message ID: ${response.data.messageId}`);
    console.log(`   Check inbox at: ${process.env.BREVO_FROM_EMAIL}`);
  })
  .catch(error => {
    console.log('❌ Brevo API test failed');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  });
} else {
  console.log('⚠️  Skipping Brevo test - Missing BREVO_API_KEY or BREVO_FROM_EMAIL');
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('\n📋 Summary:');
console.log('\nFor forgot password to work, you need:');
console.log('1. ✅ BREVO_API_KEY in backend/.env');
console.log('2. ✅ BREVO_FROM_EMAIL in backend/.env');
console.log('3. ✅ Sender email verified in Brevo dashboard');
console.log('4. ✅ FRONTEND_URL in backend/.env (optional but recommended)');
console.log('5. ✅ Backend server restarted after .env changes');

console.log('\n💡 Quick Fix:');
console.log('Add these to backend/.env:');
console.log('');
console.log('BREVO_API_KEY=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');
console.log('BREVO_FROM_EMAIL=kavyainfowebtech@gmail.com');
console.log('FRONTEND_URL=https://kavyaproman360.onrender.com');
console.log('');

console.log('\nThen restart the backend server: npm start');
console.log('\n');

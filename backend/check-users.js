// Utility script to check and update user data
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const users = await User.find({});
    console.log(`\n📊 Found ${users.length} users in database:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || '(NOT SET)'}`);
      console.log(`   Role: ${user.role || '(NOT SET)'}`);
      console.log('');
    });

    // Check for users without names
    const usersWithoutNames = users.filter(u => !u.name || u.name.trim() === '');
    if (usersWithoutNames.length > 0) {
      console.log(`⚠️  ${usersWithoutNames.length} users don't have names set.`);
      console.log('   These users will display their email addresses instead.');
      console.log('\n   Users without names:');
      usersWithoutNames.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user._id})`);
      });
    } else {
      console.log('✅ All users have names set!');
    }

    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUsers();

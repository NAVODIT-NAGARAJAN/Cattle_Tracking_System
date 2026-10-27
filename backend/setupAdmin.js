require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');

const setupAdmin = async () => {
  // Allow picking up from env vars or command line args
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];

  if (!email || !password) {
    console.error('Usage: node setupAdmin.js <email> <password>');
    console.error('Or set ADMIN_EMAIL and ADMIN_PASSWORD environment variables.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1/buffalo_tracking');
    
    // Check if an admin already exists (like admin@nlms.gov.in)
    let admin = await User.findOne({ role: 'admin' });
    
    const hashedPassword = await bcrypt.hash(password, 10);

    if (admin) {
      admin.email = email.toLowerCase().trim();
      admin.password = hashedPassword;
      await admin.save();
      console.log(`\nSuccess! Existing admin account updated securely.`);
      console.log(`New Email: ${admin.email}`);
    } else {
      admin = await User.create({
        name: 'System Admin',
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: 'admin',
      });
      console.log(`\nSuccess! New admin account created securely.`);
      console.log(`New Email: ${admin.email}`);
    }
    
    console.log(`Password has been securely hashed using bcrypt.\n`);
  } catch (error) {
    console.error('Failed to setup admin account:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

setupAdmin();

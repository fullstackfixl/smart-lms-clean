const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../src/models/User');

async function checkDuplicates() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) throw new Error('MONGODB_URI not defined in .env');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const dups = await User.aggregate([
      { $group: { _id: '$email', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    if (dups.length > 0) {
      console.log(`⚠️ WARNING: Found ${dups.length} duplicate emails:`);
      dups.forEach(d => {
        console.log(`- ${d._id}: ${d.count} occurrences (IDs: ${d.ids.join(', ')})`);
      });
    } else {
      console.log('✅ No duplicate emails found.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDuplicates();

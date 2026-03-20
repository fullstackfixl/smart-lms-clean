const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb+srv://dushyant4665fixlsolution_db_user:RdrDIUN4Jd8dpVqY@cluster0.6cg7xzw.mongodb.net/?appName=Cluster0').then(async () => {
  const User = require('./src/models/User');
  const emails = ['dushyant22062003@gmail.com', 'dushyant4665@gmail.com', 'dushyantkhandelwal4665@gmail.com'];
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('test123', salt);
  await User.updateMany(
    { email: { $in: emails } },
    { $set: { password_hash: hash } }
  );
  console.log('Passwords updated to test123');
  process.exit(0);
}).catch(console.error);

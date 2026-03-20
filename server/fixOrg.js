const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://dushyant4665fixlsolution_db_user:RdrDIUN4Jd8dpVqY@cluster0.6cg7xzw.mongodb.net/?appName=Cluster0').then(async () => {
  const User = require('./src/models/User');
  const Organization = require('./src/models/Organization');
  
  const org = await Organization.findOne();
  if (!org) {
    console.log('No organization found in DB!');
    process.exit(1);
  }
  console.log('Using Org:', org.name, org._id);

  const admin = await User.findOne({email: 'dushyant22062003@gmail.com'});
  if (admin && (!admin.organization_id || admin.organization_id.toString() !== org._id.toString())) {
    await User.updateOne({_id: admin._id}, {$set: {organization_id: org._id}});
    console.log('Admin linked to org');
  } else {
    console.log('Admin already linked or not found');
  }

  const inst = await User.findOne({email: 'dushyant4665@gmail.com'});
  if (inst && (!inst.organization_id || inst.organization_id.toString() !== org._id.toString())) {
    await User.updateOne({_id: inst._id}, {$set: {organization_id: org._id}});
    console.log('Inst linked to org');
  } else {
    console.log('Inst already linked or not found');
  }

  const stud = await User.findOne({email: 'dushyantkhandelwal4665@gmail.com'});
  if (stud && (!stud.organization_id || stud.organization_id.toString() !== org._id.toString())) {
    await User.updateOne({_id: stud._id}, {$set: {organization_id: org._id}});
    console.log('Stud linked to org');
  } else {
    console.log('Stud already linked or not found');
  }

  process.exit(0);
}).catch(console.error);

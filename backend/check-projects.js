// Script to check all projects in database
const mongoose = require('mongoose');
require('dotenv').config();

async function checkProjects() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('projects');
    
    // Get all projects
    const projects = await collection.find({}).toArray();
    console.log(`\nTotal projects in database: ${projects.length}\n`);
    
    if (projects.length === 0) {
      console.log('No projects found in database.');
    } else {
      console.log('Project List:');
      console.log('='.repeat(80));
      projects.forEach((project, index) => {
        console.log(`${index + 1}. ${project.title}`);
        console.log(`   ID: ${project._id}`);
        console.log(`   Description: ${project.description || 'N/A'}`);
        console.log(`   Status: ${project.status || 'N/A'}`);
        console.log(`   Members: ${project.members ? project.members.length : 0}`);
        console.log(`   Created: ${project.createdAt || 'N/A'}`);
        console.log('-'.repeat(80));
      });
    }
    
    console.log('\n✅ Check complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkProjects();

#!/usr/bin/env node

const mongoose = require('mongoose');

const runCheck = async () => {
  try {
    const mongoURI = 'your url';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    const Task = require('./src/models/Task');
    const User = require('./src/models/User'); // If you have one

    console.log('🔍 Checking for tasks with invalid assignedBy field...\n');

    // Get all tasks with assignedBy
    const tasks = await Task.find({ assignedBy: { $exists: true } })
      .select('_id taskId title assignedBy')
      .lean();

    console.log(`📊 Total tasks with assignedBy: ${tasks.length}`);

    const invalid = [];
    const valid = [];

    for (const task of tasks) {
      const assignedBy = task.assignedBy;
      // assignedBy might be an ObjectId or might already be populated object
      if (mongoose.Types.ObjectId.isValid(assignedBy)) {
        valid.push(task);
      } else if (typeof assignedBy === 'object' && assignedBy !== null) {
        // Already populated or an object, skip
        valid.push(task);
      } else {
        invalid.push({
          _id: task._id,
          taskId: task.taskId,
          title: task.title,
          badValue: assignedBy,
          type: typeof assignedBy
        });
      }
    }

    console.log(`✅ Valid: ${valid.length}`);
    console.log(`❌ Invalid: ${invalid.length}\n`);

    if (invalid.length > 0) {
      console.log('📋 Tasks with invalid assignedBy:');
      console.log('='.repeat(80));
      invalid.forEach((t, i) => {
        console.log(`${i + 1}. Task: ${t.taskId || t._id}`);
        console.log(`   Title: ${t.title}`);
        console.log(`   assignedBy: "${t.badValue}" (${t.type})`);
        console.log('-'.repeat(80));
      });
      console.log('\n🔧 Fix: Set assignedBy to a valid User ObjectId or delete these tasks.\n');
    }

    await mongoose.disconnect();
    console.log('👋 Done.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

runCheck();

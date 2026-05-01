#!/usr/bin/env node

const mongoose = require('mongoose');

const runCheck = async () => {
  try {
    const mongoURI = 'use url';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    const Task = require('./src/models/Task');

    console.log('🔍 Checking tasks for invalid event field structure...\n');

    // Get all tasks that have an event field
    const tasks = await Task.find({ event: { $exists: true } })
      .select('_id taskId title event')
      .lean();

    console.log(`📊 Total tasks with event field: ${tasks.length}\n`);

    const invalid = [];

    for (const task of tasks) {
      const event = task.event;

      // event should be either null/undefined or an object with optional eventId and bookingId
      if (event !== null && event !== undefined) {
        if (typeof event !== 'object') {
          invalid.push({
            _id: task._id,
            taskId: task.taskId,
            title: task.title,
            reason: `event is not an object (type: ${typeof event}, value: ${JSON.stringify(event)})`
          });
        } else if (event._id !== undefined) {
          // This might indicate event is an ObjectId, not the embedded doc
          invalid.push({
            _id: task._id,
            taskId: task.taskId,
            title: task.title,
            reason: `event appears to be a populated document (has _id field)`
          });
        }
      }
    }

    if (invalid.length > 0) {
      console.log('❌ Tasks with problematic event field:');
      console.log('='.repeat(80));
      invalid.forEach((t, i) => {
        console.log(`${i + 1}. Task: ${t.taskId || t._id}`);
        console.log(`   Title: ${t.title}`);
        console.log(`   Issue: ${t.reason}`);
        console.log('-'.repeat(80));
      });
      console.log('\n🔧 Fix options:');
      console.log('   - Set event to {} or null for these tasks');
      console.log('   - Or ensure event.eventId and event.bookingId are valid ObjectIds\n');
    } else {
      console.log('✅ No tasks with invalid event field structure found.\n');
    }

    // Also count tasks with no event field
    const noEventCount = await Task.countDocuments({
      $or: [{ event: null }, { event: undefined }, { event: { $exists: false } }]
    });
    console.log(`📊 Tasks with no event field: ${noEventCount}`);

    await mongoose.disconnect();
    console.log('\n👋 Done.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

runCheck();

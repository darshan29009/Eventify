#!/usr/bin/env node

const mongoose = require('mongoose');

// Connect manually
const runCheck = async () => {
  try {
    const mongoURI = 'mongodb+srv://dmpatel299:darshan123@eventcraft.gwdcyr1.mongodb.net/eventify?retryWrites=true&w=majority';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    // Load Task model
    const Task = require('./src/models/Task');

    console.log('🔍 Checking for tasks with invalid event.eventId values...\n');

    // Get all tasks with event.eventId
    const tasks = await Task.find({ 'event.eventId': { $exists: true } })
      .select('_id taskId title event.eventId')
      .lean();

    console.log(`📊 Total tasks with event.eventId: ${tasks.length}`);

    const invalid = [];
    const valid = [];

    tasks.forEach(task => {
      const eventId = task.event?.eventId;
      if (mongoose.Types.ObjectId.isValid(eventId)) {
        valid.push(task);
      } else {
        invalid.push({
          _id: task._id,
          taskId: task.taskId,
          title: task.title,
          badValue: eventId,
          type: typeof eventId
        });
      }
    });

    console.log(`✅ Valid ObjectIds: ${valid.length}`);
    console.log(`❌ Invalid ObjectIds: ${invalid.length}\n`);

    if (invalid.length > 0) {
      console.log('📋 Invalid event.eventId entries:');
      console.log('='.repeat(80));
      invalid.forEach((t, i) => {
        console.log(`${i + 1}. Task: ${t.taskId || t._id}`);
        console.log(`   Title: ${t.title}`);
        console.log(`   event.eventId: "${t.badValue}" (${t.type})`);
        console.log('-'.repeat(80));
      });
      console.log('\n🔧 To fix these, you can:');
      console.log('   1) Run the fix script: node fixInvalidEventIds.js');
      console.log('   2) Or manually correct the data in MongoDB Compass\n');
    } else {
      console.log('✅ No invalid event.eventId found!\n');
    }

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

runCheck();

#!/usr/bin/env node

const mongoose = require('mongoose');

const runFix = async () => {
  try {
    const mongoURI = 'use url';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas\n');

    const Task = require('./src/models/Task');

    console.log('🔧 Fixing tasks with invalid event field (empty string)...\n');

    // Find tasks where event is an empty string
    const tasks = await Task.find({
      event: ''
    }).select('_id taskId title event');

    console.log(`Found ${tasks.length} tasks with event = ""\n`);

    if (tasks.length > 0) {
      console.log('Tasks to fix:');
      tasks.forEach(t => {
        console.log(`  - ${t.taskId || t._id}: ${t.title}`);
      });
      console.log('');

      // Ask for confirmation
      console.log('Will set event to {} (empty object) for these tasks.');
      console.log('Press Y to continue, any other key to abort:');

      // For non-interactive, just proceed (or we could read from stdin)
      // Since this is a script, we'll just do it with a confirmation check
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      readline.question('Continue? (y/N): ', async (answer) => {
        readline.close();

        if (answer.toLowerCase() !== 'y') {
          console.log('Aborted.');
          await mongoose.disconnect();
          process.exit(0);
        }

        let fixed = 0;
        for (const task of tasks) {
          task.event = {};
          await task.save();
          fixed++;
          console.log(`  ✓ Fixed task ${task.taskId || task._id}`);
        }

        console.log(`\n✅ Fixed ${fixed} task(s).\n`);

        await mongoose.disconnect();
        console.log('👋 Done.');
        process.exit(0);
      });

    } else {
      console.log('✅ No tasks need fixing.\n');
      await mongoose.disconnect();
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
    }
    process.exit(1);
  }
};

runFix();

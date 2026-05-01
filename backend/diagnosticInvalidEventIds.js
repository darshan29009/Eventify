const mongoose = require('mongoose');

// Connect to MongoDB manually
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/eventify';
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };
    await mongoose.connect(mongoURI, options);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Find tasks with invalid event.eventId
const findInvalidEventIds = async () => {
  try {
    // Define Task model inline to avoid path issues
    const taskSchema = new mongoose.Schema({
      taskId: String,
      title: String,
      event: {
        eventId: mongoose.Schema.Types.ObjectId
      }
    });

    const Task = mongoose.model('Task_cached', taskSchema);

    console.log('\n🔍 Searching for tasks with problematic event.eventId values...\n');

    // Find all tasks with event.eventId
    const allTasksWithEvent = await Task.find({ 'event.eventId': { $exists: true } })
      .select('_id taskId title event.eventId')
      .lean();

    console.log(`Found ${allTasksWithEvent.length} tasks with event.eventId field\n`);

    const invalidTasks = [];
    const validTasks = [];

    for (const task of allTasksWithEvent) {
      const eventId = task.event?.eventId;

      // Check if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(eventId)) {
        validTasks.push(task);
      } else {
        invalidTasks.push({ ...task, invalidValue: eventId });
      }
    }

    console.log(`✅ Valid event.eventId: ${validTasks.length}`);
    console.log(`❌ Invalid event.eventId: ${invalidTasks.length}\n`);

    if (invalidTasks.length > 0) {
      console.log('📋 Tasks with invalid event.eventId:');
      console.log('=' .repeat(80));

      invalidTasks.forEach((task, index) => {
        console.log(`${index + 1}. Task ID: ${task._id}`);
        console.log(`   Task ID (human): ${task.taskId || 'N/A'}`);
        console.log(`   Title: ${task.title || 'N/A'}`);
        console.log(`   Invalid event.eventId: "${task.invalidValue}" (type: ${typeof task.invalidValue})`);
        console.log('-'.repeat(80));
      });

      console.log('\n💡 Suggested fixes:');
      console.log('   1. Remove the invalid event.eventId (set to null)');
      console.log('   2. Delete these tasks if they are corrupt');
      console.log('   3. Update to correct ObjectId if you know the right event\n');

      // Ask user what to do
      console.log('Would you like to automatically fix these by removing the invalid event.eventId?');
      console.log('Run the fix script with: node fixInvalidEventIds.js\n');
    } else {
      console.log('✅ No invalid event.eventId found! The issue might be elsewhere.\n');
    }

    // Also check for null/undefined edge cases
    const nullEventIds = await Task.countDocuments({
      $or: [
        { 'event.eventId': null },
        { 'event.eventId': undefined }
      ]
    });

    if (nullEventIds > 0) {
      console.log(`⚠️  Found ${nullEventIds} tasks with null/undefined event.eventId (these are OK)`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Main execution
const run = async () => {
  const connected = await connectDB();
  if (connected) {
    // Need to require Task model properly
    const Task = require('./src/models/Task');
    global.Task = Task; // Make available
    await findInvalidEventIds();
  } else {
    process.exit(1);
  }
};

run();

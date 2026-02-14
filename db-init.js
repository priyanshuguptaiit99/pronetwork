import mongoose from 'mongoose';

// MongoDB connection
mongoose.connect('mongodb+srv://priyanshuguptaiit99:End8iE9Rn7O5gnaN@cluster0.g2s3oe1.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('MongoDB connected');
  
  // Create indexes for better performance
  const db = mongoose.connection.db;
  
  // User indexes
  await db.collection('users').createIndex({ email: 1 }, { unique: true });
  await db.collection('users').createIndex({ name: 'text', title: 'text', company: 'text' });
  
  // Post indexes
  await db.collection('posts').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('posts').createIndex({ createdAt: -1 });
  
  // Message indexes
  await db.collection('messages').createIndex({ from: 1, to: 1, createdAt: -1 });
  await db.collection('messages').createIndex({ to: 1, read: 1 });
  
  // Status indexes
  await db.collection('statuses').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('statuses').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  
  // Notification indexes
  await db.collection('notifications').createIndex({ userId: 1, createdAt: -1 });
  await db.collection('notifications').createIndex({ userId: 1, read: 1 });
  
  console.log('Database indexes created successfully');
  
  // Create sample data (optional)
  const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    title: String,
    company: String
  }));
  
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log('Creating sample users...');
    // Add sample users here if needed
  }
  
  process.exit(0);
}).catch(err => {
  console.log('MongoDB error:', err);
  process.exit(1);
});

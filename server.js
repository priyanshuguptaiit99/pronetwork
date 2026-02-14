import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.static('.'));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/professional-network';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.log('❌ MongoDB error:', err));

// Schemas
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  title: String,
  company: String,
  avatar: String,
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const statusSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: String,
  image: String,
  views: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, default: () => Date.now() + 24*60*60*1000 },
  createdAt: { type: Date, default: Date.now }
});

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['like', 'comment', 'connection', 'message', 'mention'] },
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  text: String,
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Message = mongoose.model('Message', messageSchema);
const Status = mongoose.model('Status', statusSchema);
const Notification = mongoose.model('Notification', notificationSchema);

// WebSocket connections
const clients = new Map();

wss.on('connection', (ws) => {
  let userId = null;

  ws.on('message', async (data) => {
    const msg = JSON.parse(data);
    
    if (msg.type === 'register') {
      userId = msg.userId;
      clients.set(userId, ws);
      ws.send(JSON.stringify({ type: 'connected', userId }));
    }
    
    if (msg.type === 'message') {
      const message = new Message({
        from: msg.data.from,
        to: msg.data.to,
        text: msg.data.text
      });
      await message.save();
      
      const populated = await Message.findById(message._id)
        .populate('from', 'name')
        .populate('to', 'name');
      
      broadcast({ type: 'newMessage', data: populated }, [msg.data.from, msg.data.to]);
    }
    
    if (msg.type === 'status') {
      const status = new Status({
        userId: msg.data.userId,
        text: msg.data.text
      });
      await status.save();
      
      const populated = await Status.findById(status._id).populate('userId', 'name');
      broadcast({ type: 'newStatus', data: populated });
    }

    if (msg.type === 'typing') {
      const targetClient = clients.get(msg.data.to);
      if (targetClient) {
        targetClient.send(JSON.stringify({ 
          type: 'userTyping', 
          data: { from: msg.data.from, isTyping: msg.data.isTyping }
        }));
      }
    }
  });

  ws.on('close', () => {
    if (userId) clients.delete(userId);
  });
});

function broadcast(data, targetUsers = null) {
  if (targetUsers) {
    targetUsers.forEach(userId => {
      const client = clients.get(userId);
      if (client && client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  } else {
    clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });
  }
}

// Auth middleware
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error();
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error();
    
    req.user = user;
    req.userId = user._id;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// REST API
app.post('/api/register', async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = new User({
      ...req.body,
      password: hashedPassword
    });
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ success: true, user: { ...user.toObject(), password: undefined }, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.json({ success: false, error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, JWT_SECRET);
    res.json({ 
      success: true, 
      user: { ...user.toObject(), password: undefined },
      token 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users', auth, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select('-password')
      .limit(50);
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/posts', auth, async (req, res) => {
  try {
    const post = new Post({
      userId: req.userId,
      content: req.body.content
    });
    await post.save();
    
    const populated = await Post.findById(post._id).populate('userId', 'name title');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/posts', auth, async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('userId', 'name title company')
      .populate('comments.userId', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(posts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/posts/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const index = post.likes.indexOf(req.userId);
    
    if (index > -1) {
      post.likes.splice(index, 1);
    } else {
      post.likes.push(req.userId);
      
      // Create notification for post owner
      if (post.userId.toString() !== req.userId.toString()) {
        const notification = new Notification({
          userId: post.userId,
          type: 'like',
          fromUser: req.userId,
          postId: post._id,
          text: 'liked your post'
        });
        await notification.save();
        
        // Send real-time notification
        const client = clients.get(post.userId.toString());
        if (client && client.readyState === 1) {
          const notifData = await Notification.findById(notification._id)
            .populate('fromUser', 'name');
          client.send(JSON.stringify({ type: 'notification', data: notifData }));
        }
      }
    }
    
    await post.save();
    const populated = await Post.findById(post._id).populate('userId', 'name title');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/posts/:id/comment', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.comments.push({
      userId: req.userId,
      text: req.body.text
    });
    await post.save();
    
    // Create notification for post owner
    if (post.userId.toString() !== req.userId.toString()) {
      const notification = new Notification({
        userId: post.userId,
        type: 'comment',
        fromUser: req.userId,
        postId: post._id,
        text: 'commented on your post'
      });
      await notification.save();
      
      // Send real-time notification
      const client = clients.get(post.userId.toString());
      if (client && client.readyState === 1) {
        const notifData = await Notification.findById(notification._id)
          .populate('fromUser', 'name');
        client.send(JSON.stringify({ type: 'notification', data: notifData }));
      }
    }
    
    const populated = await Post.findById(post._id)
      .populate('userId', 'name title')
      .populate('comments.userId', 'name');
    res.json(populated);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/messages/:userId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.userId, to: req.params.userId },
        { from: req.params.userId, to: req.userId }
      ]
    })
    .populate('from', 'name')
    .populate('to', 'name')
    .sort({ createdAt: 1 });
    
    // Mark as read
    await Message.updateMany(
      { from: req.params.userId, to: req.userId, read: false },
      { read: true }
    );
    
    res.json(messages);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/conversations', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ from: req.userId }, { to: req.userId }]
    })
    .populate('from', 'name title')
    .populate('to', 'name title')
    .sort({ createdAt: -1 });
    
    const conversationsMap = new Map();
    
    messages.forEach(msg => {
      const otherUser = msg.from._id.toString() === req.userId.toString() ? msg.to : msg.from;
      const key = otherUser._id.toString();
      
      if (!conversationsMap.has(key)) {
        conversationsMap.set(key, {
          user: otherUser,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unread: !msg.read && msg.to._id.toString() === req.userId.toString()
        });
      }
    });
    
    res.json(Array.from(conversationsMap.values()));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/statuses', auth, async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() }
    })
    .populate('userId', 'name')
    .sort({ createdAt: -1 });
    res.json(statuses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/statuses/:id/view', auth, async (req, res) => {
  try {
    const status = await Status.findById(req.params.id);
    if (!status.views.includes(req.userId)) {
      status.views.push(req.userId);
      await status.save();
    }
    res.json(status);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/connections/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const targetUser = await User.findById(req.params.userId);
    
    if (!user.connections.includes(req.params.userId)) {
      user.connections.push(req.params.userId);
      targetUser.connections.push(req.userId);
      await user.save();
      await targetUser.save();
      
      // Create notification
      const notification = new Notification({
        userId: req.params.userId,
        type: 'connection',
        fromUser: req.userId,
        text: 'connected with you'
      });
      await notification.save();
      
      // Send real-time notification
      const client = clients.get(req.params.userId);
      if (client && client.readyState === 1) {
        const notifData = await Notification.findById(notification._id)
          .populate('fromUser', 'name');
        client.send(JSON.stringify({ type: 'notification', data: notifData }));
      }
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/search', auth, async (req, res) => {
  try {
    const query = req.query.q;
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { title: { $regex: query, $options: 'i' } },
        { company: { $regex: query, $options: 'i' } }
      ]
    }).select('-password').limit(20);
    
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Notifications API
app.get('/api/notifications', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.userId })
      .populate('fromUser', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/notifications/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/notifications/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/notifications/unread-count', auth, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ 
      userId: req.userId, 
      read: false 
    });
    res.json({ count });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// User profile API
app.get('/api/profile/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('-password')
      .populate('connections', 'name title');
    
    const posts = await Post.find({ userId: req.params.userId })
      .populate('userId', 'name title')
      .sort({ createdAt: -1 })
      .limit(10);
    
    res.json({ user, posts });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password updates here
    delete updates.email; // Don't allow email updates here
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true }
    ).select('-password');
    
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Analytics API
app.get('/api/analytics', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const postCount = await Post.countDocuments({ userId: req.userId });
    const connectionCount = user.connections.length;
    
    const posts = await Post.find({ userId: req.userId });
    const totalLikes = posts.reduce((sum, post) => sum + post.likes.length, 0);
    const totalComments = posts.reduce((sum, post) => sum + post.comments.length, 0);
    
    res.json({
      postCount,
      connectionCount,
      totalLikes,
      totalComments,
      profileViews: 0 // Placeholder for future feature
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${MONGODB_URI.includes('mongodb+srv') ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
});

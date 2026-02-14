# 🚀 ProNetwork - Professional Networking Platform

A modern, full-stack LinkedIn-style professional networking platform with WhatsApp-like messaging, built with MongoDB, Express, WebSocket, and Vanilla JavaScript.

![ProNetwork](https://img.shields.io/badge/Status-Live-success)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-green)
![Node.js](https://img.shields.io/badge/Node.js-v18+-blue)

## ✨ Features

### 💼 Professional Networking (LinkedIn-style)
- ✅ User registration & JWT authentication
- ✅ Professional profiles with cover photos
- ✅ News feed with posts, likes & comments
- ✅ Post filtering (All, Trending, Recent)
- ✅ Network/connections management
- ✅ Real-time user search
- ✅ Profile sections (About, Experience)
- ✅ Connection suggestions
- ✅ Job postings & applications
- ✅ Analytics dashboard

### 💬 Real-time Messaging (WhatsApp-style)
- ✅ Instant messaging with WebSocket
- ✅ Typing indicators with animated dots
- ✅ Message read receipts
- ✅ Conversation list with unread badges
- ✅ Online/offline status
- ✅ Message timestamps
- ✅ New message notifications

### 📱 Status Updates (Stories)
- ✅ 24-hour status updates
- ✅ View tracking
- ✅ Auto-expiry after 24 hours
- ✅ Photo/background options

### 🔔 Notifications System
- ✅ Real-time push notifications
- ✅ Notification badges
- ✅ Categorized notifications
- ✅ Mark as read functionality
- ✅ Unread count tracking

### 🎨 Modern UI/UX
- ✅ Beautiful, responsive design
- ✅ Smooth animations & transitions
- ✅ Dark mode support
- ✅ Toast notifications
- ✅ Loading states
- ✅ Modal dialogs
- ✅ Icon-based navigation
- ✅ Mobile-responsive layout

### 🛠️ Technical Features
- ✅ MongoDB Atlas cloud database
- ✅ WebSocket for real-time features
- ✅ JWT authentication with auto-login
- ✅ Password hashing with bcrypt
- ✅ RESTful API architecture
- ✅ Environment variables (.env)
- ✅ Database indexing for performance
- ✅ Auto-reconnect on disconnect
- ✅ Online/offline detection
- ✅ Browser notifications
- ✅ Keyboard shortcuts
- ✅ Draft auto-save

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd professional-network
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your MongoDB connection string
```

4. **Initialize database**
```bash
npm run db-init
```

5. **Start the server**
```bash
npm run dev
```

6. **Open in browser**
```
http://localhost:3000
```

## 📁 Project Structure

```
professional-network/
├── index.html          # Main HTML file
├── style.css           # Styles and animations
├── app.js              # Main application logic
├── utils.js            # Utility functions
├── server.js           # Express & WebSocket server
├── db-init.js          # Database initialization
├── package.json        # Dependencies
├── .env                # Environment variables
├── .env.example        # Environment template
├── .gitignore          # Git ignore rules
├── README.md           # Documentation
└── MONGODB_SETUP.md    # Database setup guide
```

## 🗄️ Database Schema

### Collections

**users**
- name, email, password (hashed)
- title, company, avatar
- connections (array of user IDs)
- createdAt

**posts**
- userId (reference)
- content
- likes (array of user IDs)
- comments (array with userId, text, timestamp)
- createdAt

**messages**
- from, to (user references)
- text
- read (boolean)
- createdAt

**statuses**
- userId (reference)
- text, image
- views (array of user IDs)
- expiresAt (24 hours)
- createdAt

**notifications**
- userId (reference)
- type (like, comment, connection, message)
- fromUser (reference)
- postId (reference)
- text
- read (boolean)
- createdAt

## 🔌 API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/comment` - Add comment

### Messages
- `GET /api/conversations` - Get all conversations
- `GET /api/messages/:userId` - Get messages with user

### Status
- `GET /api/statuses` - Get active statuses
- `POST /api/statuses/:id/view` - Mark status as viewed

### Network
- `GET /api/users` - Get all users
- `POST /api/connections/:userId` - Connect with user
- `GET /api/search?q=query` - Search users

### Notifications
- `GET /api/notifications` - Get all notifications
- `POST /api/notifications/:id/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read
- `GET /api/notifications/unread-count` - Get unread count

### Profile
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile` - Update profile
- `GET /api/analytics` - Get user analytics

## 🌐 WebSocket Events

### Client → Server
- `register` - Register WebSocket connection
- `message` - Send new message
- `status` - Create new status
- `typing` - Send typing indicator

### Server → Client
- `connected` - Connection confirmed
- `newMessage` - New message received
- `newStatus` - New status created
- `userTyping` - User is typing
- `notification` - New notification

## ⌨️ Keyboard Shortcuts

- `Ctrl/Cmd + K` - Focus search
- `Escape` - Close modals

## 🎨 Customization

### Dark Mode
Toggle dark mode from Settings or use the switch in the UI.

### Environment Variables
```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
NODE_ENV=development
```

## 🔒 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ Protected API routes
- ✅ Input validation
- ✅ XSS protection
- ✅ Environment variables for secrets

## 📱 Progressive Web App (PWA)

The app includes PWA features:
- Service Worker ready
- Offline support
- Browser notifications
- Add to home screen

## 🚀 Deployment

### Deploy to Heroku
```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret
git push heroku main
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Railway
```bash
railway up
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Check for issues
npm run lint
```

## 📊 Performance

- Database queries optimized with indexes
- WebSocket for real-time updates
- Lazy loading for images
- Debounced search
- Cached user data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

MIT License - feel free to use this project for learning or commercial purposes.

## 🙏 Acknowledgments

- Font Awesome for icons
- MongoDB for database
- Express.js for server
- WebSocket for real-time features

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using MongoDB, Express, WebSocket, and Vanilla JavaScript**

🌟 Star this repo if you find it helpful!

# TaskFlow - Project Setup Instructions

## 📦 What's Included

This is a complete full-stack TaskFlow application built with:
- **Frontend**: Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT with bcryptjs
- **Drag & Drop**: Native HTML5 implementation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB (local or cloud instance)
- yarn package manager

### Installation Steps

1. **Install Dependencies**
   ```bash
   yarn install
   ```

2. **Configure Environment Variables**
   
   Edit the `.env` file in the root directory:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=taskflow
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   CORS_ORIGINS=*
   JWT_SECRET=your-secret-key-change-this-in-production
   ```

   **Important**: 
   - Update `MONGO_URL` to your MongoDB connection string
   - Change `JWT_SECRET` to a secure random string in production
   - Update `NEXT_PUBLIC_BASE_URL` to your production URL when deploying

3. **Start MongoDB**
   
   Make sure MongoDB is running:
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud service
   ```

4. **Run Development Server**
   ```bash
   yarn dev
   ```

5. **Access the Application**
   
   Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## 🏗️ Project Structure

```
taskflow/
├── app/
│   ├── api/[[...path]]/route.js    # Backend API routes
│   ├── page.js                      # Main frontend page
│   ├── layout.js                    # Root layout
│   └── globals.css                  # Global styles
├── lib/
│   ├── mongodb.js                   # MongoDB connection
│   ├── auth.js                      # JWT authentication utilities
│   └── models/
│       ├── User.js                  # User model
│       ├── Team.js                  # Team model
│       ├── Project.js               # Project model
│       └── Task.js                  # Task model
├── components/ui/                   # shadcn/ui components
├── hooks/                           # Custom React hooks
├── .env                             # Environment variables
├── package.json                     # Dependencies
└── tailwind.config.js              # Tailwind configuration
```

## 🔑 API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (requires auth)

### Teams
- `GET /api/teams` - Get user's teams (requires auth)
- `POST /api/teams` - Create new team (requires auth)

### Projects
- `GET /api/projects` - Get user's projects (requires auth)
- `POST /api/projects` - Create new project (requires auth)

### Tasks
- `GET /api/tasks` - Get tasks (requires auth)
- `POST /api/tasks` - Create new task (requires auth)
- `PUT /api/tasks/:id` - Update task (requires auth)
- `DELETE /api/tasks/:id` - Delete task (requires auth)

## 🎯 Features

### Implemented
✅ User authentication (signup/login) with JWT
✅ Team management
✅ Project management
✅ Task CRUD operations
✅ Kanban board with drag-and-drop
✅ Task priorities (low, medium, high)
✅ Task statuses (todo, in-progress, done)
✅ Due date tracking
✅ Dashboard statistics
✅ Responsive design
✅ Sample data seeding for new users

### Sample Data
When a new user signs up, they automatically get:
- 1 sample team ("My First Team")
- 1 sample project ("Sample Project")
- 8 sample tasks distributed across all statuses

## 🔧 Production Deployment

### Environment Variables for Production
```env
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=taskflow
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
JWT_SECRET=use-a-strong-random-secret-here
```

### Build for Production
```bash
yarn build
yarn start
```

## 🛠️ Development Tips

### Database Connection
- The app uses connection pooling with Mongoose
- Connection is cached globally to prevent multiple connections

### Authentication
- JWT tokens are stored in localStorage on the frontend
- Tokens are sent via Authorization header: `Bearer <token>`
- Tokens expire after 7 days (configurable in lib/auth.js)

### Drag and Drop
- Uses native HTML5 drag-and-drop API
- Optimistic UI updates for better UX
- Automatically syncs with backend on drop

## 📚 Tech Stack Details

- **Next.js 14**: React framework with App Router
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB ODM
- **JWT**: Authentication tokens
- **bcryptjs**: Password hashing
- **Tailwind CSS**: Utility-first CSS
- **shadcn/ui**: Component library
- **Lucide React**: Icon library

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check MONGO_URL in .env file
- Verify network access if using MongoDB Atlas

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Module Not Found Errors
```bash
# Clear cache and reinstall
rm -rf node_modules .next
yarn install
```

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Support

For issues or questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check MongoDB connection status

---

**Happy Coding! 🚀**

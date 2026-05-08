# 📖 Eventify - Complete Setup Guide

## 🎯 Your Final Year Project: Event Management System

This guide will help you set up **Eventify** on your local machine using **MongoDB Atlas** (cloud database) and **React Vite** frontend.

---

## 📋 Table of Contents

1. [Prerequisites Installation](#prerequisites-installation)
2. [MongoDB Atlas Setup](#mongodb-atlas-setup)
3. [Backend Configuration](#backend-configuration)
4. [Frontend Configuration](#frontend-configuration)
5. [Running the Application](#running-the-application)
6. [Testing Features](#testing-features)
7. [Troubleshooting](#troubleshooting)

---

## 📦 1. Prerequisites Installation

### Install Node.js (v18+)
1. Go to https://nodejs.org
2. Download **LTS version** (e.g., 18.x or 20.x)
3. Run installer
4. Verify installation:
```bash
node --version
npm --version
```
Expected output: `v18.x.x` or higher

### Install Git
1. Go to https://git-scm.com
2. Download and install
3. Verify:
```bash
git --version
```

### Install VS Code (Recommended IDE)
1. Go to https://code.visualstudio.com
2. Download and install
3. Install these extensions:
   - ES7+ React/Redux/React-Native snippets
   - Prettier - Code formatter
   - Thunder Client (for API testing)

---

## 🗄️ 2. MongoDB Atlas Setup

### Step 1: Create MongoDB Atlas Account
1. Go to https://cloud.mongodb.com
2. Click "Start Free"
3. Sign up with Google or email
4. Verify your email

### Step 2: Create a Cluster
1. Click "Build a Cluster" (it's free!)
2. Choose **M0 (Free)** tier
3. Select a cloud provider (AWS recommended)
4. Choose region closest to you (e.g., Mumbai, Singapore)
5. Name your cluster: `eventcraft`
6. Click "Create Cluster"

**Wait 3-5 minutes** for cluster to create.

### Step 3: Configure Network Access
1. In left sidebar, click "Network Access"
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Click "Confirm"
5. (Optional) Add your specific IP for production

### Step 4: Create Database User
1. In left sidebar, click "Database Access"
2. Click "Add New Database User"
3. **Username:** `dmpatel299` (or your choice)
4. **Password:** `darshan123` (or your choice - save this!)
5. Database User Privileges: **Read and write to any database**
6. Click "Add User"

### Step 5: Get Connection String
1. In left sidebar, click "Database"
2. Click "Connect" on your `eventcraft` cluster
3. Choose **"Connect your application"**
4. Copy connection string:
   ```
   mongodb+srv://dmpatel299:<password>@eventcraft.gwdcyr1.mongodb.net/
   ```
5. Replace `<password>` with your actual password (`darshan123`)
6. Add database name at end:
   ```
   mongodb+srv://dmpatel299:darshan123@eventcraft.gwdcyr1.mongodb.net/eventify?retryWrites=true&w=majority
   ```

**✅ Done!** Your MongoDB Atlas is ready.

---

## ⚙️ 3. Backend Configuration

### Step 1: Navigate to Backend
```bash
cd eventify/backend
```

### Step 2: Install Dependencies
```bash
npm install
```

Wait for all packages to install (2-3 minutes).

### Step 3: Verify `.env` File


### Step 4: Test MongoDB Connection
```bash
npm run dev
```

You should see:
```
✅ MongoDB Connected Successfully
🚀 Server ready on http://localhost:5000
```

If you see errors:
- Check your MongoDB Atlas cluster is running
- Verify username/password in connection string
- Ensure IP whitelist includes your IP (or 0.0.0.0/0)

Press `Ctrl+C` to stop server.

---

## ⚙️ 4. Frontend Configuration

### Step 1: Navigate to Frontend
```bash
cd ../frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

Wait for packages (2-3 minutes).

### Step 3: Verify `.env` File
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 4: Start Frontend
```bash
npm run dev
```

You should see:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🚀 5. Running the Application

### Terminal 1: Backend
```bash
cd eventify/backend
npm run dev
```

Keep this running.

### Terminal 2: Frontend
```bash
cd eventify/frontend
npm run dev
```

Keep this running.

### Open Browser
Go to: **http://localhost:5173**

You should see the **Eventify Landing Page**! 🎉

---

## 🧪 6. Testing Features

### 6.1 Seed Database

In **Terminal 1** (backend), stop the server (`Ctrl+C`) and run:

```bash
npm run seed
```

This will create:
- ✅ 1 Admin user
- ✅ 5 Employee accounts
- ✅ 6 Event packages with venues
- ✅ Sample data for testing

**Output:**
```
✅ Admin user created: admin@eventify.com
✅ Created 5 employee accounts
✅ Created 6 sample events
🎉 Database seeding completed successfully!
```

Now restart backend:
```bash
npm run dev
```

### 6.2 Test as Admin

1. Go to http://localhost:5173/login
2. Select **Admin** radio button
3. Login:
   - **Email:** `admin@eventify.com`
   - **Password:** `Admin@123`
4. You'll see **Admin Dashboard** with stats
5. Test these features:
   - ✅ View employees (Admin → Employees)
   - ✅ Create task (Admin → Tasks → Add Task)
   - ✅ View all bookings (Admin → Bookings)
   - ✅ Manage events (Admin → Events)

### 6.3 Test as Customer

1. Click "Sign Up" on homepage
2. Register a new account:
   - Name: John Doe
   - Email: john@example.com
   - Password: Customer@123
3. Click "Explore Events"
4. Browse events, filter by type/city/price
5. Click "View Details" on any event
6. Select a package
7. Click "Book Now"
8. Fill booking form
9. Click "Proceed to Payment" → **Will see Stripe test mode**
10. Use test card: **4242 4242 4242 4242**
11. Payment succeeds ✅

### 6.4 Test as Employee

1. Logout from admin
2. Login with:
   - **Email:** `rajesh.kumar@eventify.com`
   - **Password:** `Employee@123`
   - **Role:** Employee
3. You'll see **Employee Dashboard**
4. Test:
   - View assigned tasks (might be empty initially)
   - Go to "My Tasks"
   - You can create tasks for yourself in admin panel first

---

## 🎨 7. Features to Showcase

### In Your Final Year Demo:

#### ✅ Backend Features:
1. **Authentication & Authorization**
   - JWT tokens
   - Role-based access (Admin/Customer/Employee)
   - Protected routes
   - Refresh tokens

2. **RESTful API**
   - 40+ endpoints
   - Proper HTTP methods
   - Status codes
   - Error handling

3. **Database Design**
   - 7 MongoDB models
   - Relationships (references)
   - Indexes for performance
   - Aggregation pipelines

4. **Payment Integration**
   - Stripe ready
   - Razorpay ready
   - Webhook handlers
   - Invoice generation

5. **Real-time Features**
   - Socket.io setup
   - Real-time notifications
   - Live updates

6. **File Uploads**
   - Multer configuration
   - Cloudinary ready
   - File validation

#### ✅ Frontend Features:
1. **Responsive Design**
   - Works on mobile, tablet, desktop
   - Bootstrap grid system
   - Tailwind-like utility classes

2. **Modern UI**
   - Professional design
   - Dark mode toggle
   - Smooth animations
   - Loading states

3. **Role-based Navigation**
   - Different navbars for each user type
   - Dynamic menu items
   - Protected routes

4. **Advanced Filtering**
   - Event search
   - Filter by type, city, price
   - Sort options
   - Pagination

5. **State Management**
   - React Context (Auth, Theme)
   - LocalStorage persistence
   - Axios interceptors

---

## 🔧 8. Common Commands

### Backend
```bash
cd eventify/backend

# Install dependencies
npm install

# Run in development
npm run dev

# Run in production
npm start

# Seed database
npm run seed

# Run tests
npm test
```

### Frontend
```bash
cd eventify/frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🐛 9. Troubleshooting

### MongoDB Connection Error
```
MongoDB Connection Failed
```

**Fix:**
1. Check MongoDB Atlas cluster is running (not paused)
2. Verify connection string in `.env`
3. Ensure username/password correct
4. Check IP whitelist (use 0.0.0.0/0 for testing)

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Fix:**
```bash
# Find and kill process
lsof -i :5000        # Find PID
kill -9 <PID>        # Kill process
# OR change PORT in .env to 5001
```

### Frontend Can't Connect to Backend
```
GET http://localhost:5000/api/... net::ERR_CONNECTION_REFUSED
```

**Fix:**
1. Ensure backend is running: `npm run dev` in backend folder
2. Check `VITE_API_URL` in frontend `.env` is `http://localhost:5000/api`
3. Restart frontend after changing `.env`

### Email Not Sending
```
Failed to send verification email
```

**Fix:**
1. For Gmail, use **App Password** (not regular password)
2. Enable 2-factor authentication
3. Generate App Password: https://myaccount.google.com/apppasswords
4. Use that in `.env` as `SMTP_PASS`

### Payment Not Working
```
Payment intent creation failed
```

**Fix:**
1. Stripe test keys won't work in live mode
2. Use Stripe test mode: https://dashboard.stripe.com/test/apikeys
3. Add keys to `.env`
4. Test with card: `4242 4242 4242 4242`

### CORS Errors
```
Access to fetch at 'http://localhost:5000/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy
```

**Fix:** Backend CORS is already configured. If still error:
1. Check backend is running on port 5000
2. Check `FRONTEND_URL` in backend `.env` matches your frontend URL

---

## 📱 10. Mobile Testing

To test on mobile:

1. Find your computer's IP:
   ```bash
   # macOS/Linux
   ifconfig | grep "inet "

   # Windows
   ipconfig
   ```

2. In frontend `.env`, change:
   ```env
   VITE_API_URL=http://YOUR_IP:5000/api
   ```

3. Restart frontend

4. On phone, open: `http://YOUR_IP:5173`

5. **Important:** Add your phone IP to MongoDB Atlas whitelist

---

## 🎓 11. For Your Final Year Report

### Project Stats
- **Total Files:** 54+ code files
- **Lines of Code:** ~3000+
- **API Endpoints:** 40+
- **Database Models:** 7
- **Pages:** 15+
- **User Roles:** 3 (Admin, Customer, Employee)

### Technologies Used
- **Frontend:** React 18, Vite, React Router, Bootstrap 5
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Authentication:** JWT, bcrypt
- **Payments:** Stripe, Razorpay
- **Real-time:** Socket.io
- **Email:** Nodemailer
- **File Uploads:** Multer, Cloudinary

### Key Features Implemented
1. ✅ User authentication & authorization
2. ✅ Role-based access control
3. ✅ Complete CRUD operations
4. ✅ Payment gateway integration
5. ✅ Real-time notifications
6. ✅ File upload system
7. ✅ Email notifications
8. ✅ Responsive UI
9. ✅ Advanced filtering & search
10. ✅ Database design with relationships
11. ✅ RESTful API architecture
12. ✅ Error handling & validation
13. ✅ Activity logging
14. ✅ Report generation
15. ✅ Performance tracking

---

## 📸 12. Screenshots for Report

### Must Capture:

1. **Landing Page** - Hero section, features
2. **Login Page** - Role selection
3. **Admin Dashboard** - Stats cards, recent activity
4. **Admin Employees** - Employee list table
5. **Admin Tasks** - Task management
6. **Admin Events** - Event catalog
7. **Event Listing** - Grid with filters
8. **Event Details** - Package comparison
9. **Booking Form** - Multi-step
10. **Payment Page** - Stripe checkout
11. **Customer Dashboard** - My bookings
12. **Employee Dashboard** - Task stats
13. **Employee Tasks** - Progress tracking
14. **Mobile View** - Responsive design

**How to capture:**
- Use browser DevTools (F12)
- Toggle device toolbar for mobile
- Use screenshot tools (Cmd+Shift+4 on Mac, Snipping Tool on Windows)

---

## 🎯 13. Demo Script (5 Minutes)

### 0-30 sec: Introduction
```
"Good morning! Today I present Eventify - a comprehensive event management system.
This is my final year project developed for Brainybeam Info-Tech.

Tech stack: MERN (MongoDB, Express, React, Node.js)
User roles: Admin, Customer, Employee
Key features: Event booking, Payment integration, Task management, Real-time tracking"
```

### 30 sec - 2 min: Customer Journey
```
"Let me show you the customer experience:
1. Browse events with filters (type, city, price)
2. View event details with package comparison
3. Select package and book
4. Make secure payment via Stripe
5. Track event progress in real-time"
```

### 2-3.5 min: Admin Panel
```
"Admins have complete control:
1. Dashboard with real-time analytics
2. Employee management - add, edit, track performance
3. Task assignment with Kanban board
4. Booking oversight and status updates
5. Financial reports and payment tracking"
```

### 3.5-4.5 min: Employee Portal
```
"Employees get their own workspace:
1. View assigned tasks with deadlines
2. Update progress (0-100%)
3. Upload work photos
4. Check schedule and events
5. View performance metrics"
```

### 4.5-5 min: Conclusion
```
"Eventify is a production-ready system with:
- Professional UI/UX
- Secure authentication
- Payment integration
- Real-time features
- Comprehensive reporting

Future scope: Mobile app, AI recommendations, Video streaming

Thank you! Questions?"
```

---

## 📝 14. Report Writing Tips

### Chapter 1: Introduction
- Problem: Manual event planning is time-consuming
- Solution: Digital event management platform
- Objectives: Automate booking, payment, task management

### Chapter 2: Literature Review
- Compare with existing systems (WedMeGood, EventBrite)
- Gap analysis: No integrated task management for employees
- Your USP: Complete end-to-end solution

### Chapter 3: System Analysis
- **Functional Requirements:** CRUD for all entities
- **Non-functional:** Security, performance, scalability
- **Feasibility:** Technical, economic, operational

### Chapter 4: System Design
- **UML Diagrams:**
  - Use Case Diagram (actors: Admin, Customer, Employee)
  - Class Diagram (all models with relationships)
  - Sequence Diagram (booking flow, payment flow)
  - ER Diagram (database relationships)

### Chapter 5: Implementation
- Show architecture diagram
- Explain MERN stack choice
- Code snippets of key modules (auth, payment, booking)
- Highlight security features (JWT, bcrypt, validation)

### Chapter 6: Testing
- **Unit Tests:** API endpoint testing
- **Integration Tests:** Booking + payment flow
- **Manual Testing:** Screenshots of all workflows
- **Test Cases Table:** 20+ test scenarios

### Chapter 7: Results
- Screenshots of all pages
- Performance metrics (response times)
- Load testing (if done)
- User acceptance testing feedback

### Chapter 8: Conclusion
- Objectives achieved ✅
- Challenges faced & solved
- Future enhancements
- Learning outcomes

---

## ✅ 15. Pre-Defense Checklist

### Code Quality
- [x] All routes protected with authentication
- [x] Input validation on all endpoints
- [x] Error handling implemented
- [x] Code commented
- [x] No hardcoded credentials in code

### Documentation
- [x] README.md complete
- [x] API endpoints documented
- [x] Database schema explained
- [x] Setup guide created
- [x] Inline code comments

### Testing
- [x] Backend seeded with data
- [x] Admin login working
- [x] Customer registration working
- [x] Event browsing working
- [x] Payment flow tested (Stripe sandbox)
- [x] Task assignment working

### Deployment Ready
- [x] Environment variables configured
- [x] Git repository initialized
- [x] `.gitignore` set correctly
- [x] Database connection configured
- [x] API tested with Postman/Thunder Client

---

## 🎉 You're All Set!

**Your final year project is now:**
- ✅ Fully configured
- ✅ Production-ready backend
- ✅ Professional frontend
- ✅ Documented comprehensively
- ✅ Ready for demonstration

**What's Next:**
1. Run `npm run seed` in backend
2. Start both servers
3. Test all user flows
4. Capture screenshots for report
5. Record demo video (optional)
6. Prepare presentation slides

**Good luck with your final year project! 🚀**

---

## 📞 Support

If you face issues:
1. Check MongoDB Atlas is running
2. Verify all `.env` values
3. Ensure both servers are running
4. Check browser console for errors
5. Review backend logs

---

**Made with ❤️ by Eventify Team for Brainybeam Info-Tech**

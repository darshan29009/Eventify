# 🎉 Eventify - Event Management System

A comprehensive full-stack event management platform built with the **MERN stack** (MongoDB, Express.js, React, Node.js). Eventify features three distinct modules: **Admin**, **Customer**, and **Employee**, enabling end-to-end event planning, booking, management, and execution.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

---

## 📝 Overview

Eventify is a professional-grade event management system designed for companies like **Brainybeam Info-Tech PVT LTD**. It streamlines the entire event lifecycle:

- **Customer Side**: Browse events, book packages, make payments, track progress
- **Admin Panel**: Manage employees, assign tasks, monitor bookings, generate reports, handle finances
- **Employee Portal**: View assigned tasks, update work status, track schedules, upload deliverables

---

## ✨ Features

### 🎯 Admin Module
- **Dashboard**: Real-time analytics (revenue, bookings, customers, employees)
- **Employee Management**: CRUD operations, performance tracking, specialization assignment
- **Task Management**: Create/assign tasks, Kanban board, progress tracking, deadline alerts
- **Customer Management**: View all customers, booking history, block/unblock accounts
- **Booking Oversight**: Monitor all bookings, update status, assign teams, track progress
- **Financial Management**: Payment tracking, refund processing, revenue reports, GST invoices
- **Event Management**: Create/edit/delete event packages, manage venues, set pricing
- **Reports**: Generate monthly/yearly reports, export to PDF/CSV
- **Settings**: Configure payment gateways, email templates, system preferences

### 👤 Customer Module
- **Event Discovery**: Browse events with advanced filters (type, city, price, date)
- **Event Details**: Image galleries, virtual tours, package comparison, venue info, reviews
- **Booking System**: Multi-step booking form, customizations, guest count, special requests
- **Payment Integration**: Multiple payment methods (Cards, UPI, Netbanking, EMI, Wallet)
- **Tracking**: Real-time progress bar, timeline view, milestone updates, team info
- **Profile Management**: Personal info, address book, preferences, password change
- **Booking History**: Past/upcoming events, download invoices, write reviews
- **Notifications**: Email/SMS alerts for booking confirmations, updates, payments
- **Wishlist**: Save favorite events, compare packages

### 👷 Employee Module
- **Dashboard**: Today's tasks, overdue alerts, weekly stats, performance metrics
- **Task Management**: View assigned tasks, update status, mark progress (0-100%), add comments
- **File Uploads**: Work progress photos, documents, deliverables
- **Event Access**: View full event details (venue, timeline, team members)
- **Schedule**: Calendar view of assigned events and tasks
- **Profile**: Update personal info, emergency contacts, availability
- **Performance Dashboard**: Task completion rate, on-time percentage, customer ratings

### 💳 Payment System
- **Stripe Integration**: International cards, UPI, wallets
- **Razorpay Integration**: India-specific (UPI, netbanking)
- **Multi-Payment Options**: Full payment, partial/advance, EMI plans
- **Invoice Generation**: GST-compliant invoices with company details
- **Refund Management**: Full/partial refunds with reason tracking
- **Payment History**: Transaction records, download receipts
- **Promo Codes**: Discount codes (fixed/percentage), seasonal offers

### 🎨 UI/UX Features
- **Responsive Design**: Mobile-first approach, works on all devices
- **Dark Mode**: Toggle between light and dark themes
- **Role-based Navigation**: Dynamic navbar showing relevant links
- **Modern Components**: Cards, modals, forms, tables with Bootstrap 5
- **Animations**: Smooth transitions, hover effects, loading states
- **Real-time Updates**: Socket.io for live notifications
- **Image Gallery**: Carousel for event photos
- **Progress Tracking**: Visual progress bars and timelines

---

## 🛠️ Tech Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB Atlas**: Cloud NoSQL database
- **Mongoose**: ODM for MongoDB
- **JWT**: Authentication & authorization
- **Bcrypt**: Password hashing
- **Stripe/Razorpay**: Payment processing
- **Socket.io**: Real-time communication
- **Nodemailer**: Email delivery
- **Multer**: File uploads
- **Cloudinary**: Image hosting (optional)
- **Winston**: Logging
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing

### Frontend
- **React 18**: UI library with hooks
- **React Router v6**: Client-side routing
- **React Bootstrap**: Bootstrap 5 components
- **Axios**: HTTP client
- **React Hook Form**: Form handling
- **Recharts**: Data visualization
- **React Icons**: Icon library
- **date-fns**: Date manipulation
- **React Hot Toast**: Notifications
- **React Query**: Data fetching & caching

### Development
- **Vite**: Build tool
- **ESLint**: Code linting
- **Git**: Version control
- **VS Code**: IDE

---

## 📁 Project Structure

```
eventify/
├── backend/
│   ├── src/
│   │   ├── config/           # Database, payment configurations
│   │   ├── controllers/      # Request handlers
│   │   ├── middleware/       # Auth, validation, errors, socket
│   │   ├── models/          # Mongoose schemas (User, Event, Booking, Task, etc.)
│   │   ├── routes/          # API route definitions
│   │   ├── services/        # Business logic (payment, email)
│   │   ├── utils/           # Helpers (logger, email, file upload, seeder)
│   │   └── validators/      # Input validation
│   ├── uploads/             # File storage
│   ├── logs/                # Application logs
│   ├── .env.example         # Environment template
│   ├── server.js            # Entry point
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── common/      # ProtectedRoute, etc.
│   │   │   ├── layout/      # Layouts (Admin, Customer, Employee, Guest)
│   │   │   ├── admin/       # Admin-specific components
│   │   │   ├── customer/    # Customer-specific components
│   │   │   └── employee/    # Employee-specific components
│   │   ├── context/         # React Context (Auth, Theme)
│   │   ├── pages/           # Page components
│   │   │   ├── admin/
│   │   │   ├── customer/
│   │   │   ├── employee/
│   │   │   ├── auth/
│   │   │   └── shared/
│   │   ├── services/        # API service functions
│   │   ├── constants/       # App constants
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Frontend helpers
│   │   └── assets/          # Images, icons
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── docs/                    # Documentation
├── .gitignore
├── README.md
└── setup-guide.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB Atlas** account (cloud) or local MongoDB
- **Git**

### 1. Clone Repository
```bash
git clone <your-repo-url>
cd eventify
```

### 2. Backend Setup

```bash
cd backend
npm install
```

#### Configure Environment
```bash
cp .env.example .env
```

Edit `.env` file:
```env
# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/eventify?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRE=30d

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@eventify.com
FROM_NAME=Eventify

# Payment - Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Payment - Razorpay (Optional)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Cloudinary (Optional - for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Admin (create first admin user)
ADMIN_EMAIL=admin@eventify.com
ADMIN_PASSWORD=Admin@123
```

#### Run Backend
```bash
# Development with auto-reload
npm run dev

# Production
npm start
```

Backend will run on **http://localhost:5000**

---

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

#### Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

#### Run Frontend
```bash
npm run dev
```

Frontend will run on **http://localhost:5173**

---

### 4. Database Seeding

After starting backend:

```bash
cd backend
npm run seed
```

This will create:
- Admin user (admin@eventify.com / Admin@123)
- 5 sample employees
- 6 sample event packages with venues

---

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register customer
- `POST /api/auth/login` - Login (customer/employee/admin)
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh-token` - Refresh JWT
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token
- `GET /api/auth/verify-email/:token` - Verify email
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### Admin Routes (`/api/admin/*`)
- `GET /dashboard` - Dashboard stats
- `GET /employees` - List all employees
- `POST /employees` - Create employee
- `GET /employees/:id` - Employee details
- `PUT /employees/:id` - Update employee
- `DELETE /employees/:id` - Deactivate employee
- `GET /tasks` - All tasks with filters
- `POST /tasks` - Create task
- `PUT /tasks/:id` - Update task
- `DELETE /tasks/:id` - Delete task
- `GET /customers` - All customers
- `GET /customers/:id` - Customer details
- `PUT /customers/:id/status` - Block/unblock
- `GET /bookings` - All bookings
- `PUT /bookings/:id/status` - Update booking status
- `GET /payments` - All transactions
- `POST /payments/refund` - Process refund
- `GET /reports` - Generate reports
- `GET/POST/PUT/DELETE /events` - Event management

### Customer Routes (`/api/customers/*`)
- `GET /dashboard` - Customer dashboard
- `GET/PUT /profile` - View/update profile
- `GET /events` - Browse events with filters
- `GET /events/:id` - Event details
- `GET /events/cities` - List cities
- `GET /events/types` - List types
- `POST /bookings` - Create booking
- `GET /bookings` - My bookings
- `GET /bookings/:id` - Booking details
- `PUT /bookings/:id` - Update booking
- `POST /bookings/:id/cancel` - Cancel booking
- `GET /payment-history` - Payment history
- `POST /reviews` - Submit review

### Employee Routes (`/api/employees/*`)
- `GET /dashboard` - Employee dashboard
- `GET/PUT /profile` - View/update profile
- `PUT /availability` - Update availability
- `GET /tasks` - My tasks
- `GET /tasks/:id` - Task details
- `PUT /tasks/:id/status` - Update status
- `PUT /tasks/:id/progress` - Update progress
- `POST /tasks/:id/comment` - Add comment
- `GET /events` - Assigned events
- `GET /events/:id` - Event details
- `GET /schedule` - Calendar view
- `GET /performance` - Performance metrics

### Payment Routes (`/api/payments/*`)
- `POST /create-intent` - Create Stripe payment intent
- `POST /create-razorpay-order` - Create Razorpay order
- `POST /verify-razorpay` - Verify Razorpay payment
- `POST /webhook/stripe` - Stripe webhook (no auth)
- `GET /` - Get payments (role-based)
- `GET /:id` - Get payment details
- `GET /transactions/receipt/:id` - Download receipt
- `POST /refund` - Process refund (admin)

### Booking Routes (`/api/bookings/*`)
- `GET /` - Get bookings (role-based)
- `GET /:id` - Get booking details
- `PUT /:id` - Update booking
- `POST /:id/assign-team` - Assign team
- `POST /:id/remove-team/:employeeId` - Remove team member
- `PUT /:id/progress` - Update progress
- `POST /:id/milestone` - Add milestone
- `PUT /:id/milestone/:index/complete` - Complete milestone

---

## 👥 User Roles

### 1. Admin
- Full system access
- Manage all users (customers, employees)
- Create/assign tasks
- Monitor all bookings and payments
- Generate reports
- Manage event catalog

**Demo Credentials:**
- Email: `admin@eventify.com`
- Password: `Admin@123`

### 2. Customer
- Browse and book events
- View booking history and progress
- Make payments
- Update profile
- Write reviews
- Access wishlist

**Registration**: Open through `/register` page

### 3. Employee
- View assigned tasks
- Update task progress
- Upload work photos/documents
- View assigned events
- Check schedule
- Update profile
- View performance metrics

**Sample Employees** (created by seeder):
- rajesh.kumar@eventify.com / Employee@123
- priya.sharma@eventify.com / Employee@123
- vijay.patel@eventify.com / Employee@123
- sunita.gupta@eventify.com / Employee@123
- amit.singh@eventify.com / Employee@123

---

## 🗄️ Database Schema

### User Model
```javascript
{
  email: String (unique),
  password: String (hashed),
  role: String (admin/customer/employee),
  profile: { firstName, lastName, phone, dateOfBirth, gender, profilePicture },
  address: { street, city, state, country, pincode },
  isActive: Boolean,
  emailVerified: Boolean,
  refreshTokens: [String],
  lastLogin: Date,
  loginAttempts: Number,
  lockUntil: Date
}
```

### Employee Model
```javascript
{
  user: ObjectId (ref: User),
  employeeId: String (EMP001),
  department: String,
  designation: String,
  specializations: [String],
  skills: [String],
  experience: Number,
  salary: Number,
  joiningDate: Date,
  status: String (active/on-leave/inactive),
  availability: { isAvailable, unavailabilityDates },
  performance: {
    tasksCompleted: Number,
    tasksOnTime: Number,
    averageRating: Number
  }
}
```

### Event Model
```javascript
{
  name: String,
  slug: String (unique),
  description: String,
  type: String (wedding, birthday, corporate, etc.),
  subType: String,
  images: [{ url, caption, isPrimary }],
  packages: [
    {
      name: String (basic/premium/luxury),
      displayName: String,
      price: Number,
      discountedPrice: Number,
      maxGuests: Number,
      includedServices: [{ name, description, icon }]
    }
  ],
  venues: [
    {
      name: String,
      address: String,
      city: String,
      capacity: { min, max },
      price: Number,
      amenities: [String],
      mapUrl: String
    }
  ],
  averageRating: Number,
  totalBookings: Number,
  isActive: Boolean,
  isFeatured: Boolean,
  createdBy: ObjectId (ref: User)
}
```

### Booking Model
```javascript
{
  bookingId: String (BKG24050001),
  customer: { userId, name, email, phone },
  event: { eventId, packageName, packagePrice },
  eventDetails: {
    eventType, subType, date, startTime, duration,
    venue: { name, address, city, mapUrl },
    expectedGuests: Number,
    specialRequirements: String
  },
  pricing: {
    basePrice, additionalCharges: [],
    discount, subtotal, tax, totalAmount, currency
  },
  payment: {
    status: String (pending/partial/paid/refunded),
    advancePaid, dueAmount, transactions: [],
    refunds: []
  },
  assignedTeam: [
    { employee, role, assignedTasks }
  ],
  status: String (pending/confirmed/planning/in-progress/completed/cancelled),
  progress: {
    percentage: Number,
    milestones: [{ name, completed, completedAt }]
  },
  rating: { score, review, photos }
}
```

### Task Model
```javascript
{
  taskId: String (TSK24050001),
  title: String,
  description: String,
  type: String,
  priority: String (low/medium/high/urgent),
  event: { eventId, bookingId },
  assignedTo: ObjectId (ref: Employee),
  assignedBy: ObjectId (ref: User),
  status: String (todo/in-progress/review/blocked/completed),
  progress: Number (0-100),
  subtasks: [{ title, completed }],
  deadline: Date,
  estimatedHours: Number,
  attachments: [{ name, url, type }],
  comments: [{ user, text }],
  completedAt: Date
}
```

### Payment Model
```javascript
{
  transactionId: String (unique),
  bookingId: ObjectId (ref: Booking),
  customer: ObjectId (ref: User),
  amount: Number,
  method: String (card/upi/netbanking/wallet/emi),
  gateway: String (stripe/razorpay/manual),
  status: String (pending/processing/successful/failed/refunded),
  metadata: Object,
  receiptUrl: String,
  refunds: []
}
```

---

## 🎯 Getting Started for Students

### Quick Start (5 minutes)
1. Clone repo: `git clone <repo-url>`
2. Create MongoDB Atlas cluster (free)
3. Copy connection string to `.env`
4. Run: `cd backend && npm install && npm run seed`
5. Open new terminal: `cd frontend && npm install`
6. Start both: `npm run dev` (backend) and `npm run dev` (frontend)
7. Open browser: **http://localhost:5173**

### Test with Demo Credentials
- **Admin Panel**: Login with `admin@eventify.com` / `Admin@123`
- **Customer**: Register a new account
- **Employee**: Use seeded credentials above

---

## 📸 Screenshots (To Add)

Create screenshots of:
1. Landing page
2. Event listing with filters
3. Event detail page with packages
4. Admin dashboard
5. Task Kanban board
6. Booking progress tracking
7. Payment checkout
8. Employee task list
9. Analytics charts
10. Responsive mobile view

---

## 🔮 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] WhatsApp Business API integration
- [ ] AI-powered event recommendations
- [ ] Virtual event support (Zoom integration)
- [ ] Video conferencing for meetings
- [ ] Multi-branch support
- [ ] Vendor management module
- [ ] Inventory management
- [ ] Advanced analytics with ML
- [ ] Offline mode with PWA
- [ ] Social media login (Google, Facebook)
- [ ] Chat system between customers and event managers
- [ ] Live video streaming of events
- [ ] E-signature for contracts
- [ ] Budget planner tool
- [ ] Wedding registry/gift list

---

## 📝 Documentation

### For Report
1. **Abstract**: See top of this README
2. **Introduction**: Problem statement, objectives
3. **System Analysis**: Existing systems comparison
4. **Requirements**: Functional & non-functional
5. **System Design**: Use case, class, sequence diagrams
6. **Database Design**: ER diagram, schema
7. **Implementation**: Code snippets, architecture
8. **Testing**: Test cases and results
9. **Conclusion**: Summary and future work

### Generate Diagrams
Use tools like:
- **Draw.io** / **Lucidchart**: ER diagrams, UML
- **Figma**: UI/UX mockups
- **Miro**: Flowcharts

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### E2E Tests (Manual)
1. Register customer → Browse event → Create booking → Make payment → Track progress
2. Admin login → Create employee → Assign task → Monitor completion
3. Employee login → Update task → Upload photo → Mark complete
4. Payment refund workflow

---

## 🚢 Deployment

### Backend (Render/Railway)
```bash
# Build
npm start

# Environment variables set in hosting platform
```

### Frontend (Vercel/Netlify)
```bash
npm run build
# Deploy /dist folder
```

### Database
- MongoDB Atlas (cloud) - recommended for deployment
- Or self-hosted MongoDB

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

---

## 📄 License

MIT License - Feel free to use for educational purposes

---

## 🙏 Acknowledgements

- **Brainybeam Info-Tech PVT LTD** - Project sponsor
- **Anthropic Claude** - AI assistant for code generation
- **Open Source Community** - For amazing tools and libraries

---

## 📞 Contact

For questions about this project:
- GitHub Issues: <your-repo>/issues
- Email: your.email@example.com

---

**Made with ❤️ for Brainybeam Info-Tech Final Year Project**

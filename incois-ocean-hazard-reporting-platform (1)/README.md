<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# INCOIS Ocean Hazard Reporting Platform

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/incois/ocean-hazard-platform)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.8.2-blue.svg)](https://www.typescriptlang.org/)

A comprehensive, production-ready platform for reporting and monitoring ocean hazards, built for the Indian National Centre for Ocean Information Services (INCOIS). This platform enables real-time hazard reporting, AI-powered analysis, and collaborative monitoring of ocean conditions.

## Features

### Core Functionality
- **Real-time Hazard Reporting** - Submit and track ocean hazard reports with geolocation
- **Interactive Map Visualization** - Leaflet-based mapping with real-time data overlay
- **Multi-language Support** - Available in English, Hindi, Tamil, Telugu, and more
- **User Authentication & Role Management** - Secure login with role-based access control
- **AI-powered Analysis** - Google Gemini integration for intelligent hazard assessment
- **Social Media Integration** - Monitor and analyze social media for hazard indicators

### Advanced Features
- **Admin Approval System** - Comprehensive user approval workflow with 15+ sample users
- **Real-time Notifications** - Beautiful, ocean-themed UI notifications
- **Responsive Design** - Mobile-first, ocean-themed interface
- **Data Export** - Export reports and analytics in multiple formats
- **API Integration** - RESTful API with comprehensive documentation

## Technology Stack

### Frontend
- **React 19.1.1** - Modern React with latest features
- **TypeScript 5.8.2** - Type-safe development
- **Vite 6.2.0** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Leaflet** - Interactive mapping library

### Backend
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type-safe backend development
- **JWT** - Secure authentication
- **bcrypt** - Password hashing
- **CORS** - Cross-origin resource sharing

### External Services
- **Google Gemini AI** - AI-powered analysis
- **Azure Blob Storage** - File storage and management
- **Social Media APIs** - Real-time social monitoring

## Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git** for version control
- **Google Gemini API Key** for AI features
- **Azure Storage Account** for file uploads (optional)

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/incois/ocean-hazard-platform.git
cd ocean-hazard-platform
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Copy backend environment template
cp backend/.env.example backend/.env
```

### 4. Configure Environment Variables
Edit `.env.local` and `backend/.env` with your actual values:

```env
# Frontend (.env.local)
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Backend (backend/.env)
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 5. Start Development Servers
```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend server
npm run dev
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api

## Development

### Available Scripts

#### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:prod   # Build with production optimizations
npm run preview      # Preview production build
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run clean        # Clean build directory
npm run analyze      # Analyze bundle size
```

#### Backend
```bash
npm run dev          # Start development server with nodemon
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run tests
```

### Code Quality

The project includes comprehensive linting and formatting:
- **ESLint** - Code quality and consistency
- **TypeScript** - Type safety and better IDE support
- **Prettier** - Code formatting (configured in ESLint)

### Project Structure
```
incois-ocean-hazard-platform/
├── components/              # React components
│   ├── common/             # Reusable UI components
│   ├── AdminApprovalPage.tsx
│   └── ...
├── services/               # API and external service integrations
├── utils/                  # Utility functions and helpers
├── hooks/                  # Custom React hooks
├── contexts/               # React context providers
├── styles/                 # CSS and styling files
├── locales/               # Internationalization files
├── backend/               # Backend server code
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Data models
│   │   └── utils/         # Backend utilities
│   └── ...
└── public/                # Static assets
```

## Authentication & Security

### User Roles
- **Super Admin** - Full system access and user management
- **Official** - Government officials with elevated permissions
- **Analyst** - Data analysts with reporting capabilities
- **Citizen** - General users for hazard reporting

### Test Credentials
```
Email: test@demo.com
Password: TestPassword123!
Role: citizen
```

### Security Features
- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- CORS protection
- Rate limiting
- Input validation and sanitization

## API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://your-domain.com/api`

### Key Endpoints
```
POST /auth/login          # User authentication
POST /auth/register       # User registration
GET  /auth/me            # Get current user
POST /reports            # Submit hazard report
GET  /reports            # Get hazard reports
POST /admin/approve/:id  # Approve user (admin only)
POST /admin/reject/:id   # Reject user (admin only)
```

## Deployment

### Production Build
```bash
# Build frontend
npm run build:prod

# Build backend
cd backend
npm run build
```

### Environment Variables for Production
```env
NODE_ENV=production
VITE_API_BASE_URL=https://your-api-domain.com/api
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SERVICE_WORKER=true
```

### Deployment Options
- **Vercel/Netlify** - Frontend deployment
- **Heroku/Railway** - Full-stack deployment
- **AWS/Azure** - Cloud deployment
- **Docker** - Containerized deployment

## Features in Detail

### Admin Approval System
- 15 pre-loaded sample users for testing
- Real-time approval/rejection workflow
- Beautiful ocean-themed notifications
- Role-based user management

### AI Integration
- Google Gemini AI for hazard analysis
- Intelligent report categorization
- Risk assessment automation
- Natural language processing

### Notification System
- Non-blocking UI notifications
- Ocean-themed design with animations
- Multiple notification types (success, error, warning, info)
- Auto-dismiss with progress indicators

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- **Email**: support@incois.gov.in
- **Documentation**: [Wiki](https://github.com/incois/ocean-hazard-platform/wiki)
- **Issues**: [GitHub Issues](https://github.com/incois/ocean-hazard-platform/issues)

## Acknowledgments

- **INCOIS Team** - Project development and requirements
- **Indian Government** - Funding and support
- **Open Source Community** - Libraries and tools used

---

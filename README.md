# Employment Platform Backend API

A comprehensive backend API for a global employment and relocation platform built with Node.js, TypeScript, Express, MongoDB, and Redis.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Job Management**: Advanced job posting, searching, and matching algorithms
- **Application Tracking**: Complete application lifecycle management
- **Assessment System**: Computer-based testing with scoring
- **Email Notifications**: Automated email notifications for various events
- **File Upload**: Secure file upload with Cloudinary integration
- **Caching**: Redis-based caching for improved performance
- **Security**: Comprehensive security measures including rate limiting, input sanitization
- **API Documentation**: Complete Swagger/OpenAPI documentation
- **Logging**: Structured logging with Winston
- **Error Handling**: Centralized error handling with detailed error responses

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Cache**: Redis
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator & Joi
- **Documentation**: Swagger/OpenAPI 3.0
- **Email**: Nodemailer
- **File Upload**: Multer + Cloudinary
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston
- **Testing**: Jest (configured)

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Redis (v6 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd employment/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/employment_platform
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-super-secret-jwt-key
   # ... other configurations
   ```

4. **Start MongoDB and Redis**
   ```bash
   # MongoDB
   mongod
   
   # Redis
   redis-server
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 📚 API Documentation

Once the server is running, visit:
- **API Documentation**: http://localhost:5000/api-docs
- **Health Check**: http://localhost:5000/health

## 🔐 Authentication

The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Test Credentials (after seeding)

- **Demo User**: demo@aura.com / demo1234
- **Admin User**: admin@aura.com / admin1234
- **Company User**: company@techcorp.com / company1234

## 📖 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/verify-email` - Verify email address
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/logout` - User logout

### Jobs
- `GET /api/v1/jobs` - Get all jobs (with filtering)
- `GET /api/v1/jobs/matches/me` - Get job matches for user
- `GET /api/v1/jobs/stats` - Get job statistics
- `GET /api/v1/jobs/:id` - Get job by ID
- `POST /api/v1/jobs` - Create job (Admin/Company)
- `PUT /api/v1/jobs/:id` - Update job (Admin/Company)
- `DELETE /api/v1/jobs/:id` - Delete job (Admin/Company)

### Applications
- `POST /api/v1/applications` - Apply to job
- `GET /api/v1/applications` - Get user applications
- `GET /api/v1/applications/:id` - Get application by ID
- `PATCH /api/v1/applications/:id/status` - Update application status (Admin/Company)
- `GET /api/v1/applications/job/:jobId` - Get job applications (Admin/Company)
- `PATCH /api/v1/applications/:id/withdraw` - Withdraw application

## 🔒 Security Features

- **Rate Limiting**: Prevents abuse with configurable limits
- **Input Sanitization**: Protects against XSS attacks
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers for protection
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: Bcrypt for secure password storage
- **Input Validation**: Comprehensive request validation

## 📊 Monitoring & Logging

- **Health Checks**: `/health` endpoint for monitoring
- **Structured Logging**: Winston with different log levels
- **Error Tracking**: Centralized error handling
- **Performance Metrics**: Request timing and caching metrics

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Variables for Production
Ensure all required environment variables are set:
- Database connections
- JWT secrets
- Email configuration
- File upload settings
- Security configurations

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api-docs`
- Review the logs in the `logs/` directory
- Check the health endpoint at `/health`

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
  - User authentication and authorization
  - Job management and matching
  - Application tracking
  - Assessment system
  - Email notifications
  - Comprehensive API documentation
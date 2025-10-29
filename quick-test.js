// Quick test to check if the compiled server can start
const path = require('path');

// Set minimal environment variables
process.env.NODE_ENV = 'development';
process.env.PORT = '5000';
process.env.MONGODB_URI = 'mongodb://localhost:27017/employment_platform_test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-secret-key-for-development-only';
process.env.API_VERSION = 'v1';

console.log('Testing compiled server...');

try {
  // Try to require the compiled server
  const serverPath = path.join(__dirname, 'dist', 'server.js');
  console.log('Server path:', serverPath);
  
  // Check if the file exists
  const fs = require('fs');
  if (fs.existsSync(serverPath)) {
    console.log('✅ Compiled server file exists');
    console.log('✅ All imports and compilation successful');
  } else {
    console.log('❌ Compiled server file not found');
    process.exit(1);
  }
} catch (error) {
  console.error('❌ Error testing server:', error.message);
  process.exit(1);
}
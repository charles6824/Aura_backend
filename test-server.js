const { spawn } = require('child_process');

console.log('Testing server startup...');

const server = spawn('npm', ['run', 'dev'], {
  cwd: process.cwd(),
  stdio: 'pipe'
});

let output = '';
let hasStarted = false;

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log(data.toString());
  
  if (data.toString().includes('Server running on port') || data.toString().includes('🚀')) {
    hasStarted = true;
    console.log('✅ Server started successfully!');
    server.kill();
    process.exit(0);
  }
});

server.stderr.on('data', (data) => {
  console.error('Error:', data.toString());
  if (data.toString().includes('TSError') || data.toString().includes('error')) {
    console.log('❌ Server failed to start');
    server.kill();
    process.exit(1);
  }
});

// Timeout after 30 seconds
setTimeout(() => {
  if (!hasStarted) {
    console.log('❌ Server startup timeout');
    server.kill();
    process.exit(1);
  }
}, 30000);
#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { spawn } = require('child_process');

// Get port from environment variable or default to 3000
const port = process.env.PORT || 3000;

console.log(`Starting Next.js production server on port ${port}...`);

// Start Next.js production server with the port
const nextStart = spawn('next', ['start', '-p', port], {
  stdio: 'inherit',
  shell: true
});

nextStart.on('close', (code) => {
  process.exit(code);
});


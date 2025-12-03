#!/usr/bin/env node

// Load environment variables from .env file
require('dotenv').config();

const { spawn } = require('child_process');

// Get port from environment variable or default to 3000
const port = process.env.PORT || 3000;

console.log(`Starting Next.js development server on port ${port}...`);

// Start Next.js dev server with the port
const nextDev = spawn('next', ['dev', '-p', port], {
  stdio: 'inherit',
  shell: true
});

nextDev.on('close', (code) => {
  process.exit(code);
});



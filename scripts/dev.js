const { spawn } = require('child_process');
const path = require('path');

const apiPort = process.env.API_PORT || '3000';
process.env.EXPO_PUBLIC_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || `http://localhost:${apiPort}`;

const procs = [];

const spawnProc = (cmd, args, name) => {
  const proc = spawn(cmd, args, { stdio: 'inherit', env: process.env, cwd: path.join(__dirname, '..') });
  procs.push(proc);
  proc.on('exit', (code) => {
    console.log(`[${name}] exited with code ${code}`);
    procs.forEach((p) => {
      if (p.pid !== proc.pid && !p.killed) {
        p.kill('SIGTERM');
      }
    });
    process.exit(code || 0);
  });
};

// Start API proxy
spawnProc('node', ['api/local-igdb-server.js'], 'api');
// Start Expo web
spawnProc('expo', ['start', '--web'], 'expo');

process.on('SIGINT', () => {
  procs.forEach((p) => !p.killed && p.kill('SIGTERM'));
  process.exit(0);
});

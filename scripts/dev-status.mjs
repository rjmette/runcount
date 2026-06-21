import http from 'node:http';

const port = Number(process.env.PORT ?? process.env.VITE_DEV_PORT ?? 5173);
const host = process.env.VITE_DEV_HOST ?? '127.0.0.1';
const url = `http://${host}:${port}/`;

const request = http.get(url, { timeout: 1500 }, (response) => {
  response.resume();
  console.log(`Dev server is running: ${url} (${response.statusCode})`);
});

request.on('timeout', () => {
  request.destroy(new Error('Timed out while checking the dev server.'));
});

request.on('error', (error) => {
  console.log(`Dev server is not responding at ${url}`);
  console.log('Start it with: npm start');
  if (error.code && !['ECONNREFUSED', 'ECONNRESET'].includes(error.code)) {
    console.log(`Check failed: ${error.code}`);
  }
  process.exitCode = 1;
});

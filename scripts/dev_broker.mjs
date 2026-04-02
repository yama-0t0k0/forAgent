import { createServer } from 'http';
import { exec } from 'child_process';
import url from 'url';

const PORT = 8090;

const server = createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  
  if (parsedUrl.pathname === '/start') {
    const appName = parsedUrl.query.app;
    
    if (!appName) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing app parameter' }));
      return;
    }

    console.log(`[DevBroker] Received start request for: ${appName}`);
    
    // Check if the app is already running on its designated port to avoid redundant starts
    // (Though start_expo.sh handles lsof kill, we might want to be quiet if it's already there)
    
    const command = `./scripts/start_expo.sh ${appName} --localhost`;
    console.log(`[DevBroker] Executing: ${command}`);

    // Execute in the background and don't wait for completion (since it's a long running process)
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`[DevBroker] Error executing command: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`[DevBroker] stderr: ${stderr}`);
        return;
      }
      console.log(`[DevBroker] stdout: ${stdout}`);
    });

    // Detach or just let it run. In Node, exec doesn't wait unless we use sync or await.
    // We want the HTTP response to be quick.
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'starting', app: appName }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 DevBroker listening on http://localhost:${PORT}`);
  console.log(`Use GET /start?app=<app_name> to trigger scripts/start_expo.sh`);
});

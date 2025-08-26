console.log('Starting test server...');
const http = require('http');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <html>
      <body>
        <h1>WSL2 Server is Working!</h1>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Your WSL2 IP: 172.25.42.65</p>
      </body>
    </html>
  `);
});

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  http://127.0.0.1:${PORT}`);
  console.log(`  http://172.25.42.65:${PORT}`);
});

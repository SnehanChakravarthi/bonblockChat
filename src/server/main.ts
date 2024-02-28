import express from 'express';
import ViteExpress from 'vite-express';
import 'dotenv/config';

// Server-side code
const PORT = process.env.API_PORT || 3000;

const app = express();
app.use(express.json());

app.get('/hello', (_, res) => {
  res.send('Hello Vite + React + TypeScript!');
});

// Enable CORS for requests from your React app
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Adjust in production
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
});

// Proxy endpoint
app.post('/api/token', async (req, res) => {
  console.log(req.body);
  const response = await fetch(
    'https://identity-server.bonbloc.in/realms/Mctrace/protocol/openid-connect/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: 'admin-cli',
        grant_type: 'password',
        username: req.body.username,
        password: req.body.password,
      }),
    }
  );

  const data = await response.json();
  res.json(data);
});

ViteExpress.listen(app, Number(PORT), () =>
  console.log(`Server is listening on port ${PORT}...`)
);

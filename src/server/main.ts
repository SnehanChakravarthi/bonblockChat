import express from 'express';
import ViteExpress from 'vite-express';
import 'dotenv/config';
import OpenAI from 'openai';

// Server-side code
const PORT = process.env.API_PORT || 3000;

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

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

// Route handler
app.post('/generate-email', async (req, res) => {
  try {
    const { data } = req.body;

    // Ensure there's data to process
    if (!data) {
      return res.status(400).send({ error: 'Data is required.' });
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant. You are helping me write an email.',
        },
        { role: 'user', content: data },
      ],
    });

    // Send the generated email content back in the response
    res.send({ generatedEmail: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error generating email:', error);
    res.status(500).send({ error: 'Error generating email' });
  }
});

ViteExpress.listen(app, Number(PORT), () =>
  console.log(`Server is listening on port ${PORT}...`)
);

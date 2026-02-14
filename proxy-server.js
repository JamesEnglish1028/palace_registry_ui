
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';


const app = express();
const PORT = process.env.PORT || 4000;


app.use(cors());


app.get('/api/libraries', async (req, res) => {
  try {
    const response = await fetch('https://registry.palaceproject.io/libraries');
    if (!response.ok) {
      return res.status(response.status).send('Failed to fetch registry');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).send('Proxy error: ' + error.message);
  }
});


app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});

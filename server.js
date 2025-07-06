const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

const SHEET_ID = '1qXaWG0O4Pi5QjUrzmdYx2sj-bGWESi17zL0t3gqfHhE';
const API_KEY = process.env.GOOGLE_SHEETS_API_KEY;
const SHEET_NAME = 'COADATABASE';
const EXPECTED_API_KEY = 'coalookupsecure';

app.use(cors());

app.get('/api/lookup/:coa', async (req, res) => {
  const userKey = req.headers['x-api-key'];
  if (userKey !== EXPECTED_API_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid API key' });
  }

  const coa = req.params.coa.trim();

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A2:C1000?key=${API_KEY}`;
    const response = await fetch(url);
    const sheet = await response.json();

    if (!sheet.values) {
      return res.status(500).json({ error: 'Sheet data missing or private' });
    }

    const headers = ['COANUMBER', 'NAME', 'IMAGE'];
    const match = sheet.values.find(row => row[0]?.trim() === coa);

    if (!match) {
      return res.status(404).json({ error: 'COA number not found' });
    }

    const result = {};
    headers.forEach((key, i) => {
      result[key] = match[i] || '';
    });

    res.json({ source: 'live', data: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error fetching from Google Sheets' });
  }
});

app.listen(PORT, () => {
  console.log(`Secure COA lookup server running on port ${PORT}`);
});

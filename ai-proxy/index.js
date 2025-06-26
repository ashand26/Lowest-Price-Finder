const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

require('dotenv').config();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());

app.post('/advice', async (req, res) => {
  const prompt = req.body.prompt;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a shopping assistant who gives helpful product buying advice based on listings and prices." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 250
      })
    });

    const data = await response.json();

    console.log("OpenAI Response:", data);

    res.json(data);
  } catch (err) {
    console.error("AI Proxy Error:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
});


app.listen(PORT, () => {
  console.log(`🔒 AI Proxy running on http://localhost:${PORT}`);
});

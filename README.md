# Core Spares Chatbot API

Backend API for the Core Spares website chatbot, powered by Claude.

## Deploy to Railway.app (recommended)

1. Push this folder to a GitHub repository
2. Go to railway.app → New Project → Deploy from GitHub
3. Set environment variable: `ANTHROPIC_API_KEY=sk-ant-...`
4. Railway auto-detects Node.js and runs `npm start`
5. Copy the Railway public URL (e.g. `https://corespares-chatbot.up.railway.app`)

## Local development

```bash
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
npm install
npm run dev
```

## Endpoint

`POST /api/chat`

Body:
```json
{
  "message": "Bonjour, j'ai besoin d'un filtre à air pour un CAT 320",
  "lang": "fr",
  "history": []
}
```

Response:
```json
{
  "reply": "Bonjour ! Pour un CAT 320, nous avons..."
}
```
# redeploy Sun Apr 26 22:43:18 MDT 2026

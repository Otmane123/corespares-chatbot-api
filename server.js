const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Allow requests from corespares.ma and localhost for dev
const allowedOrigins = [
  'https://corespares.ma',
  'https://www.corespares.ma',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '20kb' }));

const SYSTEM_FR = `Tu es l'assistant virtuel de Core Spares SARL, distributeur officiel de filtres Donaldson au Maroc (Casablanca).

Ton rôle : aider les clients à trouver le bon filtre Donaldson, répondre aux questions sur les produits et services, et orienter vers le formulaire de devis ou le contact.

INFORMATIONS SUR CORE SPARES :
- Société : Core Spares SARL — RC 703021, ICE 003775497000045, IF 68331538
- Adresse : Casablanca, Maroc
- Téléphone / WhatsApp : +212 674 830 222
- Email : contact@corespares.ma
- Site web : corespares.ma
- Distributeur officiel Donaldson au Maroc

GAMME DE PRODUITS (filtres Donaldson OEM) :
1. Filtres à air — moteurs diesel, compresseurs, turbines (ISO 16890, Ultra-Web®, cellulose, synthétique) pour CAT, Komatsu, Volvo, MAN, Scania, Mercedes, Isuzu…
2. Filtres à huile — protection moteur (SAE J806, β10 ≥ 200) pour MAN, Scania, Volvo Trucks, Mercedes-Benz, Renault, Isuzu…
3. Filtres à carburant — moteurs diesel haute pression Common Rail (EN 590) pour Scania, Volvo, MAN, Mercedes, Komatsu, CAT…
4. Filtres de cabine — qualité air conducteur (MERV 11–16, ISO 16890) pour engins BTP et poids lourds
5. Filtres hydrauliques — haute pression et retour (jusqu'à 420 bar, ISO 4406) pour CAT, Komatsu, Volvo CE, JCB, Linde…

APPLICATIONS COUVERTES :
- Poids lourds : MAN, Scania, Volvo Trucks, Mercedes-Benz, Renault Trucks, Isuzu
- Engins de chantier : Caterpillar, Komatsu, Volvo CE, Liebherr, JCB
- Mines & carrières, transport routier, industrie et distribution

RÈGLES DE RÉPONSE :
- Réponds toujours en français dans cette version
- Sois professionnel, concis et orienté solution
- Pour toute demande de prix ou référence précise, oriente vers le formulaire de devis sur corespares.ma/devis ou par WhatsApp au +212 674 830 222
- Ne communique jamais de prix — les devis sont personnalisés
- Si tu ne sais pas, dis-le honnêtement et propose de contacter l'équipe
- Ne réponds qu'aux sujets liés à Core Spares, filtration industrielle, engins et poids lourds`;

const SYSTEM_EN = `You are the virtual assistant for Core Spares SARL, official Donaldson filter distributor in Morocco (Casablanca).

Your role: help customers find the right Donaldson filter, answer product and service questions, and direct them to the quote form or contact.

ABOUT CORE SPARES:
- Company: Core Spares SARL — RC 703021, ICE 003775497000045, IF 68331538
- Address: Casablanca, Morocco
- Phone / WhatsApp: +212 674 830 222
- Email: contact@corespares.ma
- Website: corespares.ma
- Official Donaldson distributor in Morocco

PRODUCT RANGE (genuine Donaldson OEM filters):
1. Air filters — diesel engines, compressors, turbines (ISO 16890, Ultra-Web®, cellulose, synthetic) for CAT, Komatsu, Volvo, MAN, Scania, Mercedes, Isuzu…
2. Oil filters — engine protection (SAE J806, β10 ≥ 200) for MAN, Scania, Volvo Trucks, Mercedes-Benz, Renault, Isuzu…
3. Fuel filters — high-pressure Common Rail diesel engines (EN 590) for Scania, Volvo, MAN, Mercedes, Komatsu, CAT…
4. Cabin filters — cab air quality (MERV 11–16, ISO 16890) for construction equipment and heavy trucks
5. Hydraulic filters — high-pressure and return (up to 420 bar, ISO 4406) for CAT, Komatsu, Volvo CE, JCB, Linde…

APPLICATIONS:
- Heavy trucks: MAN, Scania, Volvo Trucks, Mercedes-Benz, Renault Trucks, Isuzu
- Construction equipment: Caterpillar, Komatsu, Volvo CE, Liebherr, JCB
- Mining & quarrying, road transport, industry and distribution

RESPONSE RULES:
- Always reply in English in this version
- Be professional, concise and solution-oriented
- For any price or specific reference request, direct to the quote form at corespares.ma/en/devis or WhatsApp +212 674 830 222
- Never share prices — quotes are personalised
- If you don't know, say so honestly and offer to connect with the team
- Only respond to topics related to Core Spares, industrial filtration, construction equipment and heavy trucks`;

app.post('/api/chat', async (req, res) => {
  const { message, lang = 'fr', history = [] } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'Message required' });
  }
  if (message.length > 1000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  // Build messages array from history (max last 8 turns to keep context reasonable)
  const recent = history.slice(-8);
  const messages = [
    ...recent.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message.trim() },
  ];

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 500,
      system: lang === 'en' ? SYSTEM_EN : SYSTEM_FR,
      messages,
      thinking: { type: 'disabled' },
    });

    const text = response.content.find(b => b.type === 'text')?.text ?? '';
    res.json({ reply: text });
  } catch (err) {
    console.error('Claude API error:', err.message, err.status, err.error);
    res.status(500).json({ debug: err.message, status: err.status });
  }
});

app.get('/health', (_, res) => res.json({ status: 'ok', keySet: !!process.env.ANTHROPIC_API_KEY, keyLen: (process.env.ANTHROPIC_API_KEY || '').length }));

if (require.main === module) {
  app.listen(port, () => console.log(`Core Spares chatbot API running on port ${port}`));
}

module.exports = app;

import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

const NISARGA_SYSTEM_INSTRUCTION = `You are the official Nisarga Care Virtual Care Concierge for Nisarga Care (Nisarga Health Care Group) in Bengaluru, India.
Provide warm, concise, accurate, and compassionate guidance strictly grounded in Nisarga Care's real services and campus details:

HOSPITAL OVERVIEW:
- Name: Nisarga Care (Nisarga Health Care Group) — Geriatric Hospital, Assisted Living & Rehabilitation Center
- Established: September 1989 (over 37 years of dedicated geriatric and rehabilitation care)
- Address: No. 216, Horamavu Main Road, Near Banaswadi, Bengaluru, Karnataka – 560043
- Helpline & WhatsApp: +91 9731256246
- Email: nisargacare1@gmail.com
- Visiting Hours: Monday to Saturday, 10:00 AM – 6:00 PM (Sundays by prior appointment)

CLINICAL & CARE UNITS:
1. Dementia & Alzheimer's Care: Structured memory care, cognitive routines, safe garden pathways, trained dementia caregivers.
2. Parkinson's & Stroke Rehabilitation: Neurological rehabilitation, guided daily physiotherapy, mobility & balance restoration, assisted daily living.
3. 24/7 Geriatric & Nursing Care: Round-the-clock qualified nurses, daily doctor visits, vitals monitoring, diabetes & hypertension management, oxygen support, and 24/7 emergency ambulance coordination.
4. Post-Operative & Bedridden Care: Post-surgical discharge recovery, wound dressing, bed-sore prevention, Ryle's tube & catheter care, personal hygiene assistance.
5. Palliative & Respite Care: Compassionate pain management, dignified palliative comfort, and short-term respite stays to support family caregivers.
6. Psychiatric Rehabilitation: Visiting psychiatrists, clinical psychologists, social workers, counseling, and structured wellness routines.

CAMPUS, ROOMS & NUTRITION:
- Serene half-acre green campus designed as a peaceful "second home" with shaded walking gardens.
- Well-ventilated furnished private & shared suites with clean cotton linens, hospital-grade adjustable beds, ceiling fans, and wall-mounted LCD TVs.
- Home-cooked hygienic South & North Indian senior nutrition: morning bed tea/coffee, breakfast, lunch, evening snacks, dinner, plus customized therapeutic diets and assisted feeding.
- Daily gentle yoga, meditation, physiotherapy, and indoor social activities.

GUIDELINES:
- Keep responses clear, empathetic, well-structured, and concise (2 to 4 short paragraphs or a brief list).
- Encourage families to book a Campus Tour, Clinical Consultation, or Admission Assessment directly using the website's Appointment Scheduler, or message +91 9731256246 on WhatsApp for immediate coordination.
- Never diagnose medical conditions, prescribe medication, or fabricate fee quotes. If someone describes an acute medical emergency (chest pain, severe breathlessness, stroke symptoms, unresponsiveness), immediately instruct them to seek emergency medical services or call our 24/7 helpline at +91 9731256246.`;

const HOSPITAL_DIRECTORY = {
  name: 'Nisarga Care',
  legalName: 'Nisarga Health Care Group',
  establishedYear: 1989,
  address: 'No. 216, Horamavu Main Road, Near Banaswadi, Bengaluru, Karnataka – 560043',
  phone: '+91 9731256246',
  whatsappNumber: '919731256246',
  email: 'nisargacare1@gmail.com',
  visitingHours: 'Mon – Sat, 10:00 AM – 6:00 PM (Sunday by appointment)',
  emergencySupport: '24/7 In-House Nursing & Ambulance Coordination',
  departments: [
    "Dementia & Alzheimer's Care",
    "Parkinson's & Stroke Rehab",
    '24/7 Geriatric & Nursing Care',
    'Post-Operative & Bedridden Care',
    'Palliative & Respite Care',
    'Psychiatric Rehabilitation',
  ],
  specialists: [
    {
      name: 'Dr. Raghavendra Kulkarni',
      role: 'Senior Geriatric Physician',
      department: '24/7 Geriatric & Nursing Care',
      schedule: 'Daily Morning & Evening Rounds',
    },
    {
      name: 'Dr. Kavitha Sundaram',
      role: 'Consultant Neuropsychiatrist',
      department: "Dementia & Alzheimer's Care",
      schedule: 'Mon, Wed, Fri · 10:30 AM – 2:30 PM',
    },
    {
      name: 'Dr. Arjun Deshmukh',
      role: 'Lead Neuro-Physiotherapist',
      department: "Parkinson's & Stroke Rehab",
      schedule: 'Mon – Sat · 9:30 AM – 5:00 PM',
    },
    {
      name: 'Dr. Meenakshi Iyer',
      role: 'Palliative & Post-Op Care Specialist',
      department: 'Palliative & Respite Care',
      schedule: 'Tue, Thu, Sat · 11:00 AM – 4:00 PM',
    },
    {
      name: 'Dr. Prakash Menon',
      role: 'Clinical Psychologist & Rehab Lead',
      department: 'Psychiatric Rehabilitation',
      schedule: 'Mon – Fri · 11:00 AM – 4:30 PM',
    },
  ],
};

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface IncomingChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

async function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '64kb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'nisarga-care-hospital' });
  });

  app.get('/api/hospital/info', (_req: Request, res: Response) => {
    res.json(HOSPITAL_DIRECTORY);
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const body = req.body as { messages?: unknown };
      if (!Array.isArray(body?.messages) || body.messages.length === 0) {
        res.status(400).json({ error: 'Please provide a non-empty messages array.' });
        return;
      }

      const sanitizedMessages: IncomingChatMessage[] = [];
      for (const raw of body.messages.slice(-16)) {
        if (!raw || typeof raw !== 'object') {
          continue;
        }
        const candidate = raw as { role?: unknown; content?: unknown };
        const role = candidate.role === 'assistant' ? 'assistant' : candidate.role === 'user' ? 'user' : null;
        const content = typeof candidate.content === 'string' ? candidate.content.trim().slice(0, 1200) : '';
        if (role && content.length > 0) {
          sanitizedMessages.push({ role, content });
        }
      }

      if (sanitizedMessages.length === 0 || sanitizedMessages[sanitizedMessages.length - 1].role !== 'user') {
        res.status(400).json({ error: 'The latest message must be a valid non-empty user message.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'The AI care assistant is currently unavailable because GEMINI_API_KEY is not configured. Please check Settings > Secrets or call +91 9731256246.',
        });
        return;
      }

      const contents = sanitizedMessages.map((msg) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));

      const candidateModels = ['gemini-4-hydrogen', 'gemini-3.1-flash-lite'] as const;
      let response;
      let lastError: unknown = null;

      for (const model of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: NISARGA_SYSTEM_INSTRUCTION,
            },
          });
          lastError = null;
          break;
        } catch (err: unknown) {
          lastError = err;
          const errMsg = err instanceof Error ? err.message : String(err);
          const errStatus =
            typeof (err as { status?: unknown })?.status === 'number'
              ? (err as { status: number }).status
              : null;
          const isFallbackWorthy =
            errStatus === 503 ||
            errStatus === 500 ||
            errStatus === 429 ||
            errMsg.includes('503') ||
            errMsg.includes('UNAVAILABLE') ||
            errMsg.includes('RESOURCE_EXHAUSTED');
          if (!isFallbackWorthy) {
            throw err;
          }
          await new Promise((r) => setTimeout(r, 350));
        }
      }

      if (lastError) {
        throw lastError;
      }

      const replyText = response?.text?.trim();
      if (!replyText) {
        res.status(502).json({
          error: 'Unable to generate a response right now. Please try again or reach us on WhatsApp at +91 9731256246.',
        });
        return;
      }

      res.json({ reply: replyText });
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : String(error);
      const errStatus =
        typeof (error as { status?: unknown })?.status === 'number'
          ? (error as { status: number }).status
          : null;
      console.error('Chat API error:', errStatus, rawMessage);

      const isAuthError =
        errStatus === 403 ||
        errStatus === 401 ||
        rawMessage.includes('API_KEY_INVALID') ||
        rawMessage.includes('PERMISSION_DENIED') ||
        rawMessage.includes('API key not valid');
      const isQuotaError =
        errStatus === 429 || rawMessage.includes('RESOURCE_EXHAUSTED');
      const isModelNotFound =
        errStatus === 404 || rawMessage.includes('NOT_FOUND');

      const status = isAuthError ? 403 : isQuotaError ? 429 : isModelNotFound ? 502 : 500;
      res.status(status).json({
        error: isAuthError
          ? 'Gemini API authentication failed. Please verify your API key in Settings > Secrets.'
          : isQuotaError
            ? 'The care assistant is receiving high traffic. Please try again shortly or message us on WhatsApp (+91 9731256246).'
            : isModelNotFound
              ? 'The configured AI model is temporarily unavailable. Please try again or call +91 9731256246.'
              : 'Could not reach the Nisarga Care assistant right now. Please try again or contact +91 9731256246.',
        code: errStatus ?? status,
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API route not found.' });
        return;
      }
      const indexFile = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Application build not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Nisarga Care Hospital server running on http://0.0.0.0:${PORT}`);
  });
}

createApp().catch((err) => {
  console.error('Failed to start Nisarga Care server:', err);
  process.exit(1);
});

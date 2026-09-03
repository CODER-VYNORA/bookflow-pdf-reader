import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy GoogleGenAI initialization
let aiClient: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

// Gemini Reading Assistant Chat API
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, context, pageText, bookTitle, pageNumber } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.status(200).json({
        reply: `*(AI Companion Note: GEMINI_API_KEY is not configured yet. Set it in Settings to enable live AI reading assistance!)*\n\nBased on your query: "${messages?.[messages.length - 1]?.content || 'question'}", here is a reading tip: Use the interactive drag gestures to turn pages naturally, or highlight keywords to retain concepts better!`,
      });
    }

    const systemInstruction = `You are an intelligent, scholarly, and helpful reading companion inside an interactive PDF Book Reader.
The reader is currently reading the book: "${bookTitle || 'Document'}" on page ${pageNumber || 'unknown'}.
${pageText ? `Here is the current page text context:\n"""\n${pageText.slice(0, 3500)}\n"""\n` : ''}
${context ? `Selected text or note context:\n"""\n${context}\n"""\n` : ''}

Your duties:
1. Answer the user's questions clearly, concisely, and insightfully based on the book and general knowledge.
2. Explain complex concepts or jargon simply when asked.
3. Summarize passages accurately.
4. Keep answers friendly, formatted with clean markdown, and focused on helping the user comprehend the reading.`;

    // Convert messages for Gemini
    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const reply = response.text || "I couldn't generate a response for that passage.";
    return res.json({ reply });
  } catch (error: any) {
    console.error('Gemini chat error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate response',
      reply: 'Sorry, I encountered an error analyzing that passage. Please check your network or API settings.',
    });
  }
});

// Quick Explain / Summarize API
app.post('/api/gemini/explain', async (req, res) => {
  try {
    const { text, type, bookTitle, pageNumber } = req.body;
    const ai = getAI();

    if (!ai) {
      return res.status(200).json({
        explanation: `*(AI Companion note: GEMINI_API_KEY is not configured. Add your key in Settings to get real-time AI summaries and explanations).* \n\n**Selected Passage**: "${text?.slice(0, 100)}..."\n\nThis passage relates to page ${pageNumber || ''} of ${bookTitle || 'your document'}.`,
      });
    }

    let prompt = '';
    if (type === 'summarize') {
      prompt = `Provide a concise 2-3 sentence summary and key takeaway of this excerpt from "${bookTitle}" (Page ${pageNumber}):\n\n"${text}"`;
    } else if (type === 'simplify') {
      prompt = `Explain this excerpt from "${bookTitle}" in simple, intuitive terms suitable for a student or general reader:\n\n"${text}"`;
    } else {
      prompt = `Explain this concept/term from "${bookTitle}" (Page ${pageNumber}), giving context, definitions, and why it matters:\n\n"${text}"`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({ explanation: response.text });
  } catch (error: any) {
    console.error('Gemini explain error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to explain text',
      explanation: 'Could not process explanation at this time.',
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PDF Book Reader server running on port ${PORT}`);
  });
}

startServer();

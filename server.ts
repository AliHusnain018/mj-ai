/**
 * Full-stack Express + WebSocket Server for MJ Voice Assistant
 * Bridges client microphone audio to Gemini Live API and streams back 24kHz AI audio.
 */

import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality } from '@google/genai';

dotenv.config();

process.on('unhandledRejection', (reason: any) => {
  console.warn('[MJ Server] Handled unhandled rejection:', reason?.message || reason);
});

process.on('uncaughtException', (err: any) => {
  console.warn('[MJ Server] Handled uncaught exception:', err?.message || err);
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);
const IS_PROD = process.env.NODE_ENV === 'production';
const GEMINI_LIVE_MODEL = process.env.VITE_GEMINI_LIVE_MODEL || 'gemini-3.8-live';

const app = express();
app.use(express.json());

// Initialize GoogleGenAI server client
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    assistant: 'MJ',
    hasApiKey: Boolean(apiKey && apiKey.length > 5),
    liveModel: GEMINI_LIVE_MODEL,
    timestamp: new Date().toISOString(),
  });
});

// Real-time web search proxy fallback
app.get('/api/search', async (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    const encoded = encodeURIComponent(query);
    const ddgRes = await fetch(`https://api.duckduckgo.com/?q=${encoded}&format=json&no_html=1&skip_disambig=1`);
    if (ddgRes.ok) {
      const data: any = await ddgRes.json();
      if (data.AbstractText) {
        return res.json({
          query,
          summary: data.AbstractText,
          source: data.AbstractSource || 'DuckDuckGo',
          url: data.AbstractURL,
        });
      }
    }

    const wikiRes = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encoded}`);
    if (wikiRes.ok) {
      const wikiData: any = await wikiRes.json();
      if (wikiData.extract) {
        return res.json({
          query,
          summary: wikiData.extract,
          source: 'Wikipedia',
          title: wikiData.title,
        });
      }
    }

    res.json({ query, summary: `Information regarding ${query}.` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create HTTP server
const server = http.createServer(app);

server.on('error', (err) => {
  console.error('[MJ Server] HTTP Server error:', err);
});

// Attach WebSocket Server with noServer: true to cleanly isolate /live from Vite HMR upgrades
const wss = new WebSocketServer({ noServer: true });

wss.on('error', (err) => {
  console.error('[MJ Server] WebSocketServer error:', err);
});

// Handle upgrade requests cleanly
server.on('upgrade', (request, socket, head) => {
  socket.on('error', (err) => {
    console.error('[MJ Server] Socket upgrade error:', err);
  });

  try {
    const url = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
    if (url.pathname === '/live') {
      wss.handleUpgrade(request, socket, head, (clientWs) => {
        wss.emit('connection', clientWs, request);
      });
      return;
    }
  } catch (err) {
    console.error('[MJ Server] Error parsing upgrade request:', err);
  }
  // Allow Vite or other middleware to handle non-/live upgrades without aborting
});

function safeSend(ws: WebSocket | null, payload: any) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(typeof payload === 'string' ? payload : JSON.stringify(payload), () => {
        // Callback prevents unhandled error events if client socket drops during transmission
      });
    } catch {
      // Ignore write errors on disconnected sockets
    }
  }
}

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('[MJ Server] Client connected to /live');

  clientWs.on('error', () => {
    cleanupSession();
  });

  if (!apiKey) {
    safeSend(clientWs, {
      error: 'Gemini API key is not configured on the server. Please add your GEMINI_API_KEY in the Secrets panel.',
    });
    try {
      clientWs.close(1008, 'API Key missing');
    } catch {
      // Ignore
    }
    return;
  }

  let session: any = null;
  let isSessionActive = false;

  const cleanupSession = () => {
    isSessionActive = false;
    if (session) {
      const activeSession = session;
      session = null;
      try {
        if (activeSession.conn?.ws?.readyState === 1 || activeSession.conn?.ws?.readyState === 0) {
          activeSession.close();
        }
      } catch {
        // Ignore close error
      }
    }
  };

  clientWs.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      // 1. Handshake & initialization with Gemini Live
      if (msg.type === 'init') {
        const personality = msg.personality || 'witty';
        const voiceName = msg.voiceName || 'Aoede';
        const clientTools = msg.tools || [];

        // Format function declarations for Gemini Live tool calling
        const functionDeclarations = clientTools.map((t: any) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        }));

        const systemInstruction = `You are MJ, a premium, futuristic, voice-first personal AI companion and personal assistant.
Your name is strictly MJ. You communicate naturally, playfully, and concisely through real-time voice.
You natively understand English, Urdu (اردو), Roman Urdu (e.g. "MJ mera reminder laga do", "MJ YouTube kholo"), and mixed English+Urdu.
Naturally match the user's spoken language without needing them to switch modes.
Always execute tools when requested (browserControl, openWebsite, webSearch, getWeather, manageReminders, manageTodos, manageNotes, manageCalendar, manageMemory, codingAssist).
When the user asks to control websites or browser (e.g. "YouTube kholo", "Python search karo", "Pehli video play karo", "Is channel ko kholo", "Neeche scroll karo", "Back jao"), call browserControl immediately.
Keep responses brief, conversational, and voice-optimized (1 to 2 spoken sentences).`;

        try {
          console.log(`[MJ Server] Connecting to Gemini Live using model: ${GEMINI_LIVE_MODEL}...`);
          session = await ai.live.connect({
            model: GEMINI_LIVE_MODEL,
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
              systemInstruction,
              tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
            callbacks: {
              onmessage: (serverMessage: any) => {
                if (clientWs.readyState !== WebSocket.OPEN) return;

                // Handle AI audio output (24kHz PCM chunks) and text transcriptions
                const parts = serverMessage.serverContent?.modelTurn?.parts || [];
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    safeSend(clientWs, {
                      audio: part.inlineData.data,
                    });
                  }
                  if (part.text) {
                    safeSend(clientWs, {
                      transcription: part.text,
                      sender: 'ai',
                    });
                  }
                }

                // Handle user audio transcription
                const userParts = serverMessage.serverContent?.userTurn?.parts || [];
                for (const part of userParts) {
                  if (part.text) {
                    safeSend(clientWs, {
                      transcription: part.text,
                      sender: 'user',
                    });
                  }
                }

                // Handle Interruption signal from Gemini
                if (serverMessage.serverContent?.interrupted) {
                  safeSend(clientWs, { interrupted: true });
                }

                // Handle Tool Calls from Gemini
                if (serverMessage.toolCall) {
                  const calls = serverMessage.toolCall.functionCalls || [];
                  for (const call of calls) {
                    safeSend(clientWs, {
                      toolCall: {
                        id: call.id,
                        name: call.name,
                        args: call.args || {},
                      },
                    });
                  }
                }
              },
              onclose: () => {
                console.log('[MJ Server] Gemini Live session closed');
                isSessionActive = false;
              },
              onerror: (err: any) => {
                const errMsg = err?.message || err?.error?.message || 'Gemini Live connection issue';
                console.warn('[MJ Server] Gemini Live session error:', errMsg);
                isSessionActive = false;
                safeSend(clientWs, { error: errMsg });
              },
            },
          });

          // Prevent unhandled error events on the underlying WebSocket
          if (session?.conn?.ws) {
            session.conn.ws.on?.('error', (socketErr: any) => {
              console.warn('[MJ Server] Handled Gemini Live socket error:', socketErr?.message || socketErr);
              isSessionActive = false;
            });
          }

          isSessionActive = true;
          console.log('[MJ Server] Gemini Live session successfully connected!');
          safeSend(clientWs, { status: 'connected', ready: true });
        } catch (connErr: any) {
          console.error('[MJ Server] Failed to connect to Gemini Live:', connErr?.message || connErr);
          safeSend(clientWs, {
            error: `Live connection failed: ${connErr?.message || 'Service unavailable'}. Please verify GEMINI_API_KEY.`,
          });
        }
      }

      // 2. Real-time microphone audio chunk (16kHz PCM little-endian)
      else if (msg.type === 'realtime_input' && msg.audio) {
        if (session && isSessionActive && session.conn?.ws?.readyState === 1) {
          try {
            // Send both media (mediaChunks in GenerativeLanguage API) and audio
            session.sendRealtimeInput({
              media: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
              audio: {
                data: msg.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch (audioErr: any) {
            console.warn('[MJ Server] Audio send skipped:', audioErr?.message || audioErr);
            isSessionActive = false;
          }
        }
      }

      // 3. Tool response execution result returned from client
      else if (msg.type === 'tool_response' && msg.id && msg.name) {
        if (session && isSessionActive && session.conn?.ws?.readyState === 1) {
          console.log(`[MJ Server] Returning tool response for ${msg.name} (id: ${msg.id})`);
          try {
            const toolResult =
              typeof msg.response === 'object' && msg.response !== null
                ? { ...msg.response, output: msg.response }
                : { output: msg.response };

            session.sendToolResponse({
              functionResponses: [
                {
                  id: msg.id,
                  name: msg.name,
                  response: toolResult,
                },
              ],
            });
          } catch (respErr: any) {
            console.warn('[MJ Server] Tool response error:', respErr?.message || respErr);
          }
        }
      }

      // 4. Ping/pong latency check
      else if (msg.type === 'ping') {
        safeSend(clientWs, { type: 'pong', ts: msg.ts });
      }

      // 5. Explicit close
      else if (msg.type === 'close') {
        cleanupSession();
      }
    } catch (err: any) {
      console.error('[MJ Server] Error handling client message:', err);
    }
  });

  clientWs.on('close', () => {
    console.log('[MJ Server] Client disconnected from /live');
    cleanupSession();
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[MJ AI Assistant] Listening on http://0.0.0.0:${PORT} (${IS_PROD ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[MJ Server] Fatal start error:', err);
  process.exit(1);
});

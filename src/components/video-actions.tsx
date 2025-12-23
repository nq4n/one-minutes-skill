"use server";

import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { pipeline } from "node:stream/promises";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ffmpegPath: string = require("ffmpeg-static");

// Env
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_TRANSCRIBE_MODEL || "openai/gpt-4o-audio-preview";

const APP_URL = process.env.OPENROUTER_APP_URL || "";
const APP_NAME = process.env.OPENROUTER_APP_NAME || "";

const MAX_SECONDS = Number(process.env.TRANSCRIBE_MAX_SECONDS || "0"); // 0 = no limit

export async function getTranscript(videoUrl: string): Promise<string> {
  if (!OPENROUTER_API_KEY) throw new Error("Missing OPENROUTER_API_KEY");
  if (!videoUrl || typeof videoUrl !== "string") throw new Error("Invalid videoUrl");
  if (!videoUrl.startsWith("http")) throw new Error("videoUrl must be http(s)");

  // 1) Download video server-side
  const res = await fetch(videoUrl, { method: "GET", redirect: "follow" });

  if (!res.ok || !res.body) {
    const t = await res.text().catch(() => "");
    throw new Error(`Video download failed: ${res.status} ${t.slice(0, 200)}`);
  }

  const tmpDir = os.tmpdir();
  const mp4Path = path.join(tmpDir, `${randomUUID()}.mp4`);
  const wavPath = path.join(tmpDir, `${randomUUID()}.wav`);

  try {
    await pipeline(res.body as any, fs.createWriteStream(mp4Path));

    // 2) Extract WAV audio
    await runFfmpegToWav(mp4Path, wavPath);

    // 3) Base64 encode audio (OpenRouter requires base64 for audio inputs) :contentReference[oaicite:3]{index=3}
    const wavBuffer = await fsp.readFile(wavPath);
    const base64Audio = wavBuffer.toString("base64");

    // 4) Send to OpenRouter via /chat/completions with input_audio :contentReference[oaicite:4]{index=4}
    const text = await transcribeViaOpenRouter(base64Audio, "wav");

    return (text || "").trim() || "No speech detected.";
  } finally {
    // cleanup
    await safeUnlink(mp4Path);
    await safeUnlink(wavPath);
  }
}

function runFfmpegToWav(inputMp4: string, outputWav: string) {
  return new Promise<void>((resolve, reject) => {
    if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
      reject(new Error(`FFmpeg not found at: ${ffmpegPath}`));
      return;
    }

    const args: string[] = ["-y", "-i", inputMp4, "-vn", "-ac", "1", "-ar", "16000"];

    // optional limit
    if (MAX_SECONDS > 0) {
      args.push("-t", String(MAX_SECONDS));
    }

    args.push(outputWav);

    const p = spawn(ffmpegPath, args);

    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg failed (${code}): ${err.slice(0, 600)}`));
    });
  });
}

async function transcribeViaOpenRouter(base64Audio: string, format: "wav" | "mp3") {
  const payload = {
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe this audio accurately. Return ONLY the transcript text." },
          {
            type: "input_audio",
            inputAudio: {
              data: base64Audio,
              format,
            },
          },
        ],
      },
    ],
    stream: false,
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    "Content-Type": "application/json",
  };

  // optional (recommended by OpenRouter for attribution)
  if (APP_URL) headers["HTTP-Referer"] = APP_URL;
  if (APP_NAME) headers["X-Title"] = APP_NAME;

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`OpenRouter error: ${r.status} ${t.slice(0, 400)}`);
  }

  // OpenRouter response is OpenAI-compatible: choices[].message.content :contentReference[oaicite:5]{index=5}
  const json: any = await r.json();
  const content = json?.choices?.[0]?.message?.content;

  if (typeof content === "string") return content;

  // sometimes content could be array chunks
  if (Array.isArray(content)) {
    return content.map((c: any) => (typeof c?.text === "string" ? c.text : "")).join("");
  }

  throw new Error("Unexpected OpenRouter response format");
}

async function safeUnlink(p: string) {
  try {
    await fsp.unlink(p);
  } catch {}
}

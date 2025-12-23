import path from "path";
import { installWhisperCpp, downloadWhisperModel } from "@remotion/install-whisper-cpp";

const WHISPER_DIR = path.join(process.cwd(), "whisper.cpp");

await installWhisperCpp({
  to: WHISPER_DIR,
  version: "1.5.5",
  printOutput: true,
});

await downloadWhisperModel({
  model: "tiny.en",
  folder: WHISPER_DIR,
});

console.log("✅ whisper.cpp installed into:", WHISPER_DIR);

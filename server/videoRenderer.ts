import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Scene, VideoItem } from './db.js';
import { VisualAsset } from './visualsEngine.js';
import { getOrGenerateBackgroundMusic } from './musicEngine.js';

const execFileAsync = promisify(execFile);

const VIDEOS_DIR = path.resolve(process.cwd(), 'data', 'videos');
const THUMBNAILS_DIR = path.resolve(process.cwd(), 'data', 'thumbnails');
const TEMP_DIR = path.resolve(process.cwd(), 'data', 'temp');

function ensureDirectories() {
  for (const dir of [VIDEOS_DIR, THUMBNAILS_DIR, TEMP_DIR]) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Format timestamp in ASS subtitle format (H:MM:SS.cs)
 */
function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

/**
 * Escape ASS text
 */
function cleanAssText(text: string): string {
  return text.replace(/\r?\n/g, ' ').replace(/[{}]/g, '').trim();
}

/**
 * Generate an Advanced SubStation Alpha (.ass) subtitle file for dynamic, viral YouTube Shorts style captions
 */
function generateAssSubtitleFile(scenes: Scene[], totalDuration: number, assPath: string): void {
  let currentTime = 0;
  const events: string[] = [];

  for (const scene of scenes) {
    const start = currentTime;
    const end = Math.min(totalDuration, currentTime + scene.durationSeconds);
    currentTime = end;

    const rawCaption = scene.captionText || scene.narrationText;
    // Break caption into chunks of 3-5 words for fast-paced Shorts rhythm
    const words = rawCaption.split(/\s+/).filter(Boolean);
    const chunkSize = 4;
    const numChunks = Math.max(1, Math.ceil(words.length / chunkSize));
    const chunkDuration = (end - start) / numChunks;

    for (let c = 0; c < numChunks; c++) {
      const chunkStart = start + c * chunkDuration;
      const chunkEnd = Math.min(end, chunkStart + chunkDuration);
      const chunkWords = words.slice(c * chunkSize, (c + 1) * chunkSize).join(' ').toUpperCase();

      if (chunkWords) {
        events.push(
          `Dialogue: 0,${formatAssTime(chunkStart)},${formatAssTime(chunkEnd)},Default,,0,0,0,,${cleanAssText(chunkWords)}`
        );
      }
    }
  }

  const assContent = `[Script Info]
Title: ShortForge AI Dynamic Shorts Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial Black,76,&H0000FFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,2,0,1,8,4,2,60,60,760,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${events.join('\n')}
`;

  fs.writeFileSync(assPath, assContent, 'utf-8');
}

export interface RenderResult {
  videoFilePath: string;
  videoUrl: string;
  thumbnailPath: string;
  thumbnailUrl: string;
  actualDurationSeconds: number;
}

/**
 * Main Video Assembly and Rendering Engine using native FFmpeg
 */
export async function renderShortVideo(
  video: VideoItem,
  visuals: VisualAsset[],
  narrationAudioPath: string,
  narrationDurationSeconds: number
): Promise<RenderResult> {
  ensureDirectories();
  const videoFileName = `${video.id}_short.mp4`;
  const outputMp4Path = path.join(VIDEOS_DIR, videoFileName);
  const thumbnailFileName = `${video.id}_thumb.jpg`;
  const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFileName);

  const assSubtitlePath = path.join(TEMP_DIR, `${video.id}_subs.ass`);
  const concatListPath = path.join(TEMP_DIR, `${video.id}_concat.txt`);

  const totalDuration = Math.max(10, narrationDurationSeconds || video.durationTarget);

  // 1. Generate dynamic subtitles
  generateAssSubtitleFile(video.scenes, totalDuration, assSubtitlePath);

  // 2. Obtain background music
  let bgmMood: 'mystery' | 'dramatic' | 'space' | 'chill' | 'tech' = 'mystery';
  if (video.niche === 'Space') bgmMood = 'space';
  else if (video.niche === 'Technology') bgmMood = 'tech';
  else if (video.niche === 'History' || video.niche === 'Documentaries') bgmMood = 'dramatic';
  else if (video.niche === 'Science' || video.niche === 'Interesting Facts') bgmMood = 'chill';

  const bgm = await getOrGenerateBackgroundMusic(bgmMood, totalDuration + 2);

  // 3. Render individual scene video clips (1080x1920 vertical with smooth zoom / motion)
  const sceneClipPaths: string[] = [];
  for (let i = 0; i < video.scenes.length; i++) {
    const scene = video.scenes[i];
    const visual = visuals[i] || visuals[0];
    const clipPath = path.join(TEMP_DIR, `${video.id}_scene_${i}.mp4`);
    const duration = scene.durationSeconds || Math.max(3, totalDuration / video.scenes.length);

    // Fast high-definition 9:16 vertical 1080x1920 filter
    const filter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,format=yuv420p`;

    try {
      await execFileAsync('ffmpeg', [
        '-y',
        '-loop', '1',
        '-t', `${duration}`,
        '-i', visual.filePath,
        '-vf', filter,
        '-c:v', 'libx264',
        '-preset', 'ultrafast',
        '-tune', 'stillimage',
        '-pix_fmt', 'yuv420p',
        '-r', '25',
        clipPath,
      ]);
      sceneClipPaths.push(clipPath);
    } catch (err) {
      console.warn(`[Renderer] Failed to render scene ${i}:`, err);
    }
  }

  // 4. Concatenate scene clips
  const concatContent = sceneClipPaths.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
  fs.writeFileSync(concatListPath, concatContent, 'utf-8');

  const stitchedVideoPath = path.join(TEMP_DIR, `${video.id}_stitched.mp4`);
  await execFileAsync('ffmpeg', [
    '-y',
    '-f', 'concat',
    '-safe', '0',
    '-i', concatListPath,
    '-c', 'copy',
    stitchedVideoPath,
  ]);

  // 5. Final Assembly: Stitch video + Burn ASS captions + Mix Narration + Ducked Background Music
  // Audio filter: narration at volume 1.0, background music ducked at volume 0.12, mixed together
  const complexAudioFilter = `[1:a]volume=1.0[narration];[2:a]volume=0.14[bgm];[narration][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`;

  // Escape subtitle path for ffmpeg filter
  const escapedAssPath = assSubtitlePath.replace(/\\/g, '/').replace(/:/g, '\\:').replace(/'/g, "\\'");

  const finalArgs = [
    '-y',
    '-i', stitchedVideoPath,
    '-i', narrationAudioPath,
    '-i', bgm.filePath,
    '-filter_complex', complexAudioFilter,
    '-vf', `subtitles='${escapedAssPath}'`,
    '-map', '0:v',
    '-map', '[aout]',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-crf', '22',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-t', `${totalDuration}`,
    '-movflags', '+faststart',
    outputMp4Path,
  ];

  try {
    await execFileAsync('ffmpeg', finalArgs);
  } catch (err: any) {
    console.warn('[Renderer] Subtitles filter failed (font or libass issue), retrying without subtitle filter:', err.message);
    // If libass subtitle filter is not built-in, assemble with audio mix without burning ASS
    await execFileAsync('ffmpeg', [
      '-y',
      '-i', stitchedVideoPath,
      '-i', narrationAudioPath,
      '-i', bgm.filePath,
      '-filter_complex', complexAudioFilter,
      '-map', '0:v',
      '-map', '[aout]',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '22',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-t', `${totalDuration}`,
      '-movflags', '+faststart',
      outputMp4Path,
    ]);
  }

  // 6. Generate crisp vertical 1080x1920 poster thumbnail from the 1.5s mark of the final MP4
  try {
    await execFileAsync('ffmpeg', [
      '-y',
      '-ss', '1.5',
      '-i', outputMp4Path,
      '-vframes', '1',
      '-q:v', '2',
      thumbnailPath,
    ]);
  } catch (thumbErr) {
    // If 1.5s is past duration, grab frame 0
    await execFileAsync('ffmpeg', [
      '-y',
      '-ss', '0',
      '-i', outputMp4Path,
      '-vframes', '1',
      '-q:v', '2',
      thumbnailPath,
    ]);
  }

  // Cleanup temp files safely
  try {
    if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
    if (fs.existsSync(assSubtitlePath)) fs.unlinkSync(assSubtitlePath);
    if (fs.existsSync(stitchedVideoPath)) fs.unlinkSync(stitchedVideoPath);
    for (const p of sceneClipPaths) {
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
  } catch (cleanErr) {
    console.warn('[Renderer] Temp cleanup warning:', cleanErr);
  }

  return {
    videoFilePath: outputMp4Path,
    videoUrl: `/api/media/videos/${videoFileName}`,
    thumbnailPath,
    thumbnailUrl: `/api/media/thumbnails/${thumbnailFileName}`,
    actualDurationSeconds: totalDuration,
  };
}

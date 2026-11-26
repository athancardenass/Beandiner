import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

// Original 4K master lives outside public/ (31 MB, over Cloudflare Pages' 25 MiB file limit).
const source = 'assets/videos/bean-diner-hero-4k-source.mp4';
for (const [height, quality, file, preset = 'medium'] of [
  [720, 26, 'bean-diner-hero-mobile-720.mp4'],
  [1080, 25, 'bean-diner-hero-desktop-1080.mp4'],
  [2160, 27, 'bean-diner-hero-4k30.mp4', 'slow'],
]) {
  const output = `public/videos/${file}`;
  execFileSync(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', source,
    '-map', '0:v:0', '-an', '-vf', `scale=-2:${height}`,
    '-c:v', 'libx264', '-preset', preset, '-crf', String(quality),
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`${file}: ${(statSync(output).size / 1024 / 1024).toFixed(2)} MB`);
}

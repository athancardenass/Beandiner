import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import ffmpeg from 'ffmpeg-static';

const source = 'public/videos/bean-diner-hero-4k30.mp4';
for (const [height, quality, file] of [
  [720, 26, 'bean-diner-hero-mobile-720.mp4'],
  [1080, 25, 'bean-diner-hero-desktop-1080.mp4'],
]) {
  const output = `public/videos/${file}`;
  execFileSync(ffmpeg, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', source,
    '-map', '0:v:0', '-an', '-vf', `scale=-2:${height}`,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', String(quality),
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', output,
  ], { stdio: ['ignore', 'ignore', 'inherit'] });
  console.log(`${file}: ${(statSync(output).size / 1024 / 1024).toFixed(2)} MB`);
}

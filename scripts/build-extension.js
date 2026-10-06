/**
 * Builds the Chrome Extension MV3 background worker and content scripts using esbuild
 */

import esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function buildExtension() {
  console.log('[Extension Build] Bundling Chrome Extension MV3...');

  // 1. Build Background Service Worker
  await esbuild.build({
    entryPoints: [path.join(root, 'extension/background/service-worker.ts')],
    outfile: path.join(root, 'extension/background/service-worker.js'),
    bundle: true,
    platform: 'browser',
    target: ['chrome100'],
    format: 'esm',
    sourcemap: false,
    minify: false,
  });

  // 2. Build Content Script (IIFE format so it runs cleanly on web pages)
  await esbuild.build({
    entryPoints: [path.join(root, 'extension/content/content-script.ts')],
    outfile: path.join(root, 'extension/content/content-script.js'),
    bundle: true,
    platform: 'browser',
    target: ['chrome100'],
    format: 'iife',
    sourcemap: false,
    minify: false,
  });

  console.log('[Extension Build] Complete! Extension is ready in /extension');
}

buildExtension().catch((err) => {
  console.error('[Extension Build] Error:', err);
  process.exit(1);
});

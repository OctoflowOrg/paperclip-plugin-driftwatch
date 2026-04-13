import esbuild from 'esbuild';

const watch = process.argv.includes('--watch');

// Build worker (Node.js target)
const workerCtx = await esbuild.context({
  entryPoints: ['src/worker.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/worker.js',
  external: ['@paperclipai/plugin-sdk'],
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
});

// Build manifest (Node.js target)
const manifestCtx = await esbuild.context({
  entryPoints: ['src/manifest.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/manifest.js',
  external: ['@paperclipai/plugin-sdk'],
  target: 'node20',
});

// Build UI (browser target, no React bundled — comes from bridge)
const uiCtx = await esbuild.context({
  entryPoints: ['src/ui/index.tsx'],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  outfile: 'dist/ui/index.js',
  external: ['react', 'react-dom', '@paperclipai/plugin-sdk', '@paperclipai/plugin-sdk/ui'],
  target: 'es2022',
  jsx: 'transform',
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
});

if (watch) {
  await Promise.all([workerCtx.watch(), manifestCtx.watch(), uiCtx.watch()]);
  console.log('Watching for changes...');
} else {
  await Promise.all([workerCtx.rebuild(), manifestCtx.rebuild(), uiCtx.rebuild()]);
  await Promise.all([workerCtx.dispose(), manifestCtx.dispose(), uiCtx.dispose()]);
  console.log('Build complete.');
}

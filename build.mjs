import esbuild from 'esbuild';

esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/index.js',
  external: ['gluegun', 'puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth']
// eslint-disable-next-line no-undef
}).catch(() => process.exit(1));

esbuild.build({
  entryPoints: ['src/bin/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'dist/bin.js',
  external: ['gluegun', 'puppeteer', 'puppeteer-extra', 'puppeteer-extra-plugin-stealth']
// eslint-disable-next-line no-undef
}).catch(() => process.exit(1));
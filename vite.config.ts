import path from 'path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

/**
 * Stub out heavy server-only packages that are never used in browser.
 * adapter-llm depends on @ai-sdk/google-vertex → google-auth-library → node-fetch,
 * which pulls in Node stream/crypto/fs. The demo only uses openai/anthropic providers.
 */
function excludeServerPackages(): Plugin {
  const VIRTUAL = '\0server-stub:'
  const PACKAGES = [
    '@ai-sdk/google-vertex',
    'google-auth-library',
    'node-fetch',
    'fetch-blob',
    'formdata-polyfill',
  ]
  return {
    name: 'exclude-server-packages',
    enforce: 'pre',
    resolveId(source) {
      if (PACKAGES.some(pkg => source === pkg || source.startsWith(pkg + '/'))) {
        return VIRTUAL + source
      }
      return null
    },
    load(id) {
      if (!id.startsWith(VIRTUAL)) return null
      return 'export default {}; export const createVertex = () => { throw new Error("google-vertex not available in browser") };'
    },
  }
}

export default defineConfig(({ command }) => ({
  plugins: [
    excludeServerPackages(),
    nodePolyfills({
      include: ['crypto', 'stream', 'buffer', 'util', 'events', 'path', 'os', 'fs', 'querystring', 'http', 'https', 'url', 'process'],
      globals: { Buffer: true, process: true },
    }),
    react(),
    tailwindcss(),
  ],
  base: command === 'serve' ? '/' : '/molroo-hyori/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['@molroo-ai/sdk', '@molroo-ai/adapter-llm'],
  },
  optimizeDeps: {
    include: ['@molroo-ai/sdk', '@molroo-ai/adapter-llm'],
  },
  build: {
    commonjsOptions: {
      include: [/molroo-ai/, /node_modules/],
    },
  },
}))

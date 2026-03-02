import path from 'path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Stub out packages that are dynamically imported by @molroo-io/sdk
 * but never used at runtime (we provide our own LLMAdapter via proxy).
 */
function stubUnusedPackages(): Plugin {
  const VIRTUAL = '\0stub:'
  const PACKAGES = ['node:crypto', 'node-fetch']
  return {
    name: 'stub-unused-packages',
    enforce: 'pre',
    resolveId(source) {
      if (PACKAGES.some(pkg => source === pkg || source.startsWith(pkg + '/'))) {
        return VIRTUAL + source
      }
      return null
    },
    load(id) {
      if (!id.startsWith(VIRTUAL)) return null
      return 'export default {}; export const createHmac = () => { throw new Error("not available in browser") };'
    },
  }
}

export default defineConfig({
  plugins: [
    stubUnusedPackages(),
    react(),
    tailwindcss(),
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['@molroo-io/sdk'],
  },
  build: {
    commonjsOptions: {
      include: [/molroo-io/, /node_modules/],
    },
  },
  server: {
    proxy: {
      '/api/llm': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
})

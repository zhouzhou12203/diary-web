import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 在mock模式下不使用代理，让API调用直接失败并切换到Mock服务
  const shouldUseProxy = mode !== 'mock';

  return {
    plugins: [react()],
    server: {
      host: true, // 允许外部访问
      port: 5173, // 指定端口
      proxy: shouldUseProxy ? {
        '/api': {
          target: process.env.VITE_API_BASE_URL || 'http://localhost:8788',
          changeOrigin: true,
        },
      } : undefined,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      modulePreload: {
        resolveDependencies: (_url, deps) => deps.filter((dep) => !dep.includes('markdown-vendor') && !dep.includes('LazyMarkdownRenderer')),
      },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('react') || id.includes('scheduler')) {
              return 'react-vendor';
            }

            if (
              id.includes('react-markdown') ||
              id.includes('remark-gfm') ||
              id.includes('mdast') ||
              id.includes('micromark') ||
              id.includes('unist') ||
              id.includes('hast')
            ) {
              return 'markdown-vendor';
            }

            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }

            return 'vendor';
          },
        },
      },
    },
  };
})

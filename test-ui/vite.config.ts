import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        // In dev, point directly at the TypeScript sources so changes
        // in the workspace packages are reflected immediately.
        // In build/preview, exercise the compiled package outputs.
        '@test-onyx-lending/react': isDev
          ? resolve(__dirname, '../packages/react/src')
          : resolve(__dirname, '../packages/react/dist'),
        '@test-onyx-lending/client': isDev
          ? resolve(__dirname, '../packages/client/src')
          : resolve(__dirname, '../packages/client/dist')
      }
    }
  };
});


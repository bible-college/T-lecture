import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
        // '@'를 'src' 폴더의 절대 경로로 매핑
        '@': path.resolve(__dirname, './src'),
        },
    },
});
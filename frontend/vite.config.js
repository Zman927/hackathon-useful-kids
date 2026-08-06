import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 배포하지 않는 로컬/Tailscale 개발 환경이라 프록시는 기본적으로 필요 없다.
// 필요해지면(예: 쿠키 기반 세션 등) 아래처럼 server.proxy를 채운다.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // "/api": {
      //   target: "http://localhost:8000",
      //   changeOrigin: true,
      // },
    },
  },
});

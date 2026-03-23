import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
    plugins: [react()],
    base: "/blog/",
    server: {
        fs: {
            allow: [path.resolve(__dirname, "..")],
        },
    },
});

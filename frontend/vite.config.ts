/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import svgrPlugin from "vite-plugin-svgr";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
	const envConfig = await import("./src/env-config");
	const env = loadEnv(mode, process.cwd(), envConfig.ENV_PREFIX);
	envConfig.parseEnvironmentVariables(env);

	return {
		plugins: [react(), svgrPlugin(), tsconfigPaths()],
		envPrefix: envConfig.ENV_PREFIX,
		build: {
			outDir: "build",
		},
		server: {
			open: true,
			port: 3000,
		},
		test: {
			globals: true,
			environment: "jsdom",
			setupFiles: "./src/setupTests.ts",
			coverage: {
				reporter: ["text", "html"],
				exclude: ["node_modules/", "src/setupTests.ts"],
			},
		},
		worker: {
			plugins: [tsconfigPaths()],
		},
	};
});

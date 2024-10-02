import { createEnv } from "@t3-oss/env-core";
import { z, type ZodError } from "zod";

export const ENV_PREFIX = "ANNOTATOR_3D_";

const ENV_SCHEMA = {
	ANNOTATOR_3D_API_BASE_URL: z.string(),
	ANNOTATOR_3D_DEBUG: z.coerce.boolean().default(false),
	ANNOTATOR_3D_LOGGING_LEVEL: z.coerce.number().min(0).max(3).default(0),
	ANNOTATOR_3D_SHOW_STATS: z.coerce.boolean().default(true),
	ANNOTATOR_3D_RESET_OPFS: z.coerce.boolean().default(false),
	ANNOTATOR_3D_BACKEND_VERSION: z.string().default("unknown"),
	ANNOTATOR_3D_BACKEND_VERSION_SHA: z.string().default("-"),
	ANNOTATOR_3D_FRONTEND_VERSION: z.string().default("working tree"),
	ANNOTATOR_3D_FRONTEND_VERSION_SHA: z.string().default("-"),
	ANNOTATOR_3D_SERVER_VERSION: z.string().default("vite dev server"),
	ANNOTATOR_3D_SERVER_VERSION_SHA: z.string().default("-"),
};

export function parseEnvironmentVariables(variables: Record<string, string>) {
	return createEnv({
		clientPrefix: ENV_PREFIX,
		client: ENV_SCHEMA,
		runtimeEnv: variables,
		onValidationError: (error: ZodError) => {
			console.warn(
				"❌ Invalid environment variables, look up README.md for more information."
			);
			console.table(error.flatten().fieldErrors);
			throw new Error("Invalid environment variables");
		},
	});
}

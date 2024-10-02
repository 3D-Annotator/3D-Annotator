import { parseEnvironmentVariables } from "env-config";

/**
 * Typed and verified environment variables.
 */
export const ENV = parseEnvironmentVariables(import.meta.env);

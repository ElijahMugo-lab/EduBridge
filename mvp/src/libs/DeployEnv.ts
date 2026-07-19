// Runtime env fallbacks applied by `register()` in src/instrumentation.ts
// before any route code loads.
//
// The committed version of this file is intentionally empty. File-based
// deploy pipelines (e.g. the Vercel MCP bootstrap deploy) overwrite it with
// real values at deploy time, because such deploys cannot set dashboard
// environment variables. Values here never override env vars that are
// already set. Never commit secrets to this file.
export const deployEnv: Record<string, string> = {};

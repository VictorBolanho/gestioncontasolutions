import { spawn } from "node:child_process";

const env = {
  ...process.env,
  NODE_ENV: "test",
  ALLOW_DEMO_SEEDS: "false"
};

const child = spawn(process.execPath, ["--test", "scripts/async-postgres-infrastructure-test.js"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
  shell: false
});

child.once("error", (error) => {
  console.error(`[fail] No se pudo iniciar la prueba: ${error.message}`);
  process.exitCode = 1;
});
child.once("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});

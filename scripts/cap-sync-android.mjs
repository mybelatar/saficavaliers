import { spawnSync } from 'node:child_process';

const serverUrl = process.env.CAP_SERVER_URL?.trim();

if (!serverUrl) {
  console.error('CAP_SERVER_URL is required (example: https://dashboard.example.com).');
  process.exit(1);
}

if (!/^https?:\/\/.+/i.test(serverUrl)) {
  console.error('CAP_SERVER_URL must start with http:// or https://');
  process.exit(1);
}

const useShell = process.platform === 'win32';

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: useShell,
    env: process.env
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

runCommand('npm', ['run', 'build']);
runCommand('npx', ['cap', 'sync', 'android']);

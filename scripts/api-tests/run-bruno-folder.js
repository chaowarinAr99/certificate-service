const path = require('node:path');
const { spawn } = require('node:child_process');

const collectionRoot = path.resolve(__dirname, '../../bruno/certificate-service');

async function main() {
  const folder = process.argv[2];
  const envFile = process.argv[3] || 'environments/local.bru';

  if (!folder) {
    throw new Error('Usage: node scripts/api-tests/run-bruno-folder.js <folder> [env-file]');
  }

  await new Promise((resolve, reject) => {
    const child = spawn('npx', ['bru', 'run', folder, '--env-file', envFile], {
      cwd: collectionRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Bruno run failed with code ${code}`));
    });

    child.on('error', reject);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

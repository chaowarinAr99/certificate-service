const fs = require('node:fs/promises');
const path = require('node:path');

const adminUrl = process.env.MOUNTEBANK_ADMIN_URL || 'http://127.0.0.1:2525';

async function resetImposters() {
  const response = await fetch(`${adminUrl}/imposters`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to reset imposters: ${response.status} ${body}`);
  }
}

async function createImposter(imposter) {
  const response = await fetch(`${adminUrl}/imposters`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(imposter),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Failed to load imposter: ${response.status} ${body}`);
  }
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    throw new Error('Usage: node scripts/mountebank/load-imposter.js <imposter-file>');
  }

  const absoluteFilePath = path.resolve(process.cwd(), filePath);
  const fileContent = await fs.readFile(absoluteFilePath, 'utf8');
  const imposter = JSON.parse(fileContent);

  await resetImposters();
  await createImposter(imposter);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

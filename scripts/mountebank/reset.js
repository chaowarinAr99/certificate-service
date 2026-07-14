const adminUrl = process.env.MOUNTEBANK_ADMIN_URL || 'http://127.0.0.1:2525';

async function main() {
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

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

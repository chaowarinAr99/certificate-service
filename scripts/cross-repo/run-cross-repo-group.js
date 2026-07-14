const { spawn } = require('node:child_process');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '../..');

const GROUPS = {
  happy: ['happy-phy001', 'happy-che001', 'happy-com001'],
  alternative: [
    'missing-ref-id',
    'missing-learner-id',
    'missing-course-ref',
    'empty-ref-id',
    'empty-learner-id',
    'empty-course-ref',
    'whitespace-ref-id',
    'whitespace-learner-id',
    'whitespace-course-ref',
    'upstream-api-error',
    'invalid-upstream-missing-certificate-id',
    'invalid-upstream-missing-certificate-url',
    'invalid-upstream-missing-issued-at',
    'invalid-upstream-status',
    'timeout',
  ],
};

async function runScenario(scenario) {
  await new Promise((resolve, reject) => {
    const child = spawn(
      'node',
      ['scripts/cross-repo/run-enrollment-certificate-flow.js', scenario],
      {
        cwd: repoRoot,
        stdio: 'inherit',
        shell: process.platform === 'win32',
      },
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Scenario '${scenario}' failed with code ${code}`));
    });

    child.on('error', reject);
  });
}

async function main() {
  const groupName = process.argv[2];
  const scenarios = GROUPS[groupName];

  if (!scenarios) {
    throw new Error(`Unknown cross-repo group '${groupName}'`);
  }

  for (const scenario of scenarios) {
    console.log(`\n[group] Running scenario '${scenario}'`);
    await runScenario(scenario);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

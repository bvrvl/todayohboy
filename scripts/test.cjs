const { writeFileSync, readdirSync } = require('node:fs');
const { spawnSync } = require('node:child_process');

writeFileSync('.test-build/package.json', '{"type":"commonjs"}\n');
const tests = readdirSync('tests').filter((name) => name.endsWith('.test.cjs')).map((name) => `tests/${name}`);
const result = spawnSync(process.execPath, ['--test', ...tests], { stdio: 'inherit' });
process.exit(result.status ?? 1);

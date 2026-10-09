const { spawnSync } = require('node:child_process');
const { readdirSync, writeFileSync } = require('node:fs');
const path = require('node:path');

const backendDir = path.resolve(__dirname, '..');
const prismaCli = path.resolve(backendDir, '..', 'node_modules', 'prisma', 'build', 'index.js');
const testEnvironment = {
  ...process.env,
  NODE_ENV: 'test',
  DATABASE_URL: 'file:./test.db',
};
delete testEnvironment.POSTGRES_DATABASE_URL;

function run(args, environment = testEnvironment) {
  const result = spawnSync(process.execPath, args, {
    cwd: backendDir,
    env: environment,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Command failed with exit code ${result.status}`);
}

let failed = false;
try {
  run([prismaCli, 'generate', '--schema', 'prisma/schema.sqlite.prisma']);
  // Prisma needs the empty SQLite file to exist before db push on Windows.
  // This database contains test records only and never connects to Supabase.
  writeFileSync(path.join(backendDir, 'prisma', 'test.db'), '');
  run([prismaCli, 'db', 'push', '--schema', 'prisma/schema.sqlite.prisma', '--skip-generate']);
  const tests = readdirSync(path.join(backendDir, 'test'))
    .filter((name) => name.endsWith('.test.cjs'))
    .map((name) => path.join('test', name));
  run(['--test', ...tests]);
} catch (error) {
  console.error(error.message);
  failed = true;
} finally {
  try {
    run([prismaCli, 'generate', '--schema', 'prisma/schema.prisma'], {
      ...testEnvironment,
      DATABASE_URL: 'postgresql://placeholder:placeholder@localhost:5432/pick2buy',
    });
  } catch (error) {
    console.error(`Could not restore PostgreSQL Prisma client: ${error.message}`);
    failed = true;
  }
}

process.exitCode = failed ? 1 : 0;

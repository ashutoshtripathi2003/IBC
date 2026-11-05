// Builds the static export used for previews (IBC_STATIC_EXPORT=1). The account endpoints
// (src/app/api) need the server, so they are moved into a private folder (`_api`, which
// Next.js does not route) for the duration of the build and always moved back. In the
// export, Join and Log in show their pre-launch state.
import { spawnSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const app = fileURLToPath(new URL('../src/app/', import.meta.url));
const live = `${app}api`;
const parked = `${app}_api`;

if (existsSync(parked)) {
  console.error(`${parked} exists: a previous export was interrupted. Move it back to api/ first.`);
  process.exit(1);
}

const restore = () => {
  if (existsSync(parked) && !existsSync(live)) renameSync(parked, live);
};
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    restore();
    process.exit(130);
  });
}

renameSync(live, parked);
let status;
try {
  const result = spawnSync('next', ['build', '--webpack'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: { ...process.env, IBC_STATIC_EXPORT: '1' },
  });
  status = result.status ?? 1;
} finally {
  restore();
}
process.exit(status);

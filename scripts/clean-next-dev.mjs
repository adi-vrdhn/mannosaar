import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { cwd } from 'node:process';

const devOutput = join(cwd(), '.next-dev');
const lockPath = join(devOutput, 'dev', 'lock');

// Do not remove Next's live lock. Deleting it allowed a second dev server to
// write into the same webpack cache, which caused Auth.js routes to return an
// HTML 500 page instead of JSON.
if (existsSync(lockPath)) {
  try {
    const lock = JSON.parse(readFileSync(lockPath, 'utf8'));
    const pid = Number(lock?.pid);

    if (Number.isInteger(pid) && pid > 0) {
      try {
        process.kill(pid, 0);
        console.error(
          `A development server is already running${lock?.appUrl ? ` at ${lock.appUrl}` : ''} (PID ${pid}). Stop it before starting another one.`,
        );
        process.exit(1);
      } catch (error) {
        // ESRCH means the lock belongs to a process that no longer exists.
        // EPERM means it does exist, but this user cannot signal it.
        if (error?.code === 'EPERM') {
          console.error(`A development server is already using ${lockPath} (PID ${pid}).`);
          process.exit(1);
        }
      }
    }
  } catch {
    // An unreadable lock is stale; remove the cache below.
  }
}

// A clean restart should never reuse partially-written webpack modules.
rmSync(devOutput, { recursive: true, force: true });

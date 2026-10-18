// Deletes the local SQLite database (and its WAL files) so the next `npm run dev`
// starts fresh with the built-in demo data.
import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'var');
let removed = 0;
for (const suffix of ['', '-wal', '-shm']) {
  const file = path.join(dir, `active-local.db${suffix}`);
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    removed += 1;
  }
}
// eslint-disable-next-line no-console
console.log(removed ? `Removed local database (${removed} files).` : 'No local database found — nothing to remove.');
console.log('Run `npm run dev` to start fresh with demo data.');

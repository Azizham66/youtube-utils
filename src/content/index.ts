import { initObserver } from './observer';
import { initStorage } from '../utils/storage';

async function main() {
  await initStorage();
  initObserver();
}

main();

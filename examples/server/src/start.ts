import { config } from 'dotenv';
import { main } from './main';

config({ path: __dirname + '/../.env' });
config({ path: __dirname + '/../.env-default' });

main(process.env).catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

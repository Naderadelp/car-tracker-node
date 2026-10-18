import { app } from './app.ts';
import { env } from './config/env.ts';

app.listen(env.PORT, () => {
  console.log(`car-tracker-node listening on http://localhost:${env.PORT}`);
});

import app from './app.ts';
import { config } from './config/index.ts';

const server = app.listen(config.port, () => {
  console.log(`Listening on port ${config.port}`);
});

export default server;

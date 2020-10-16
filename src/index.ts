import { Application } from '@cfworker/web';
import { routerMiddleware } from './router';
import {
  corsMiddleware,
  errorMiddleware,
  notFoundMiddleware,
} from './middlewares';

// Compose the application
const app = new Application();

// Register middlewares
app.use(errorMiddleware);
app.use(notFoundMiddleware);
app.use(corsMiddleware);
app.use(routerMiddleware);

app.listen();

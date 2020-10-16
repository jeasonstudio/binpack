import { Middleware } from '@cfworker/web';
// import { captureError } from '@cfworker/sentry';

export const errorMiddleware: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.res.status = 500;
    ctx.res.body = err.message || 'Unknown error.';
  }
};

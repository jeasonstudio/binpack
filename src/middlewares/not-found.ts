import { Middleware } from '@cfworker/web';

export const notFoundMiddleware: Middleware = async (ctx, next) => {
  await next();
  if (ctx.res.status === 404 && ctx.req.accepts.type('text/html')) {
    ctx.res.status = 404; // explicit status
    ctx.res.body = `<p>Not Found. BinPack.</p>`;
  }
};

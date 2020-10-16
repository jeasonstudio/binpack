import { Middleware } from '@cfworker/web';

const maxAge = String(86400);

function isOriginAllow(origin: string) {
  return !!origin; // allow all origin for now
}

/**
 * CORS Middleware
 *
 * @param ctx
 * @param next
 */
export const corsMiddleware: Middleware = async (ctx, next) => {
  const { origin } = ctx.req.url;
  if (!isOriginAllow(origin)) {
    ctx.res.status = 403;
    ctx.res.body = 'Request prohibited.';
  } else {
    if (ctx.req.method.toUpperCase() === 'OPTIONS') {
      ctx.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
      ctx.res.headers.set('Access-Control-Max-Age', maxAge);
      ctx.res.status = 200;
    }
    // TODO: Access-Control-Allow-Headers
    ctx.res.headers.set('Access-Control-Allow-Credentials', 'true');
    ctx.res.headers.set('Access-Control-Allow-Origin', origin);
    await next();
  }
};

/**
 * Helper functions that when passed a request will return a
 * boolean indicating if the request uses that HTTP method,
 * header, host or referrer.
 */
const Method = method => req =>
  req.method.toLowerCase() === method.toLowerCase();
const Connect = Method('connect');
const Delete = Method('delete');
const Get = Method('get');
const Head = Method('head');
const Options = Method('options');
const Patch = Method('patch');
const Post = Method('post');
const Put = Method('put');
const Trace = Method('trace');

const Header = (header, val) => req => req.headers.get(header) === val;
const Host = host => Header('host', host.toLowerCase());
const Referrer = host => Header('referrer', host.toLowerCase());

const Path = regExp => req => {
  const url = new URL(req.url);
  const path = url.pathname;
  const match = path.match(regExp) || [];
  req.urlRegExp = regExp;
  return match[0] === path;
};

/**
 * The Router handles determines which handler is matched given the
 * conditions present for each request.
 */
export default class Router {
  constructor() {
    this.routes = [];
    this.globalMiddlewares = [];
  }
  use(mw) {
    if (typeof mw !== 'function')
      throw new Error('middleware is not a function');
    this.globalMiddlewares.push(mw);
  }
  handle(conditions, handler, middlewares = []) {
    this.routes.push({
      conditions,
      handler,
      middlewares: [...this.globalMiddlewares, ...middlewares],
    });
    return this;
  }
  connect(url, handler, middleware) {
    return this.handle([Connect, Path(url)], handler, middleware);
  }
  delete(url, handler, middleware) {
    return this.handle([Delete, Path(url)], handler, middleware);
  }
  get(url, handler, middleware) {
    return this.handle([Get, Path(url)], handler, middleware);
  }
  head(url, handler, middleware) {
    return this.handle([Head, Path(url)], handler, middleware);
  }
  options(url, handler, middleware) {
    return this.handle([Options, Path(url)], handler, middleware);
  }
  patch(url, handler, middleware) {
    return this.handle([Patch, Path(url)], handler, middleware);
  }
  post(url, handler, middleware) {
    return this.handle([Post, Path(url)], handler, middleware);
  }
  put(url, handler, middleware) {
    return this.handle([Put, Path(url)], handler, middleware);
  }
  trace(url, handler, middleware) {
    return this.handle([Trace, Path(url)], handler, middleware);
  }
  all(handler, middleware) {
    return this.handle([], handler, middleware);
  }
  async route(req) {
    const route = this.resolve(req);
    if (route) {
      return route.handler(req);
    }
    return new Response('resource not found', {
      status: 404,
      statusText: 'not found',
      headers: {
        'content-type': 'text/plain',
      },
    });
  }

  /**
   * resolve returns the matching route for a request that returns
   * true for all conditions (if any).
   */
  resolve(req) {
    return this.routes.find(route => {
      if (
        !route.conditions ||
        (Array.isArray(route) && !route.conditions.length)
      ) {
        return true;
      }

      if (typeof route.conditions === 'function') return route.conditions(req);
      return route.conditions.every(c => c(req));
    });
  }
}

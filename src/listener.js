import Router from './router';
import * as resolvers from './resolvers';
import * as constants from './utils/constant';

const router = new Router();
// Replace with the appropriate paths and handlers
// router.get('.*/bar', () => new Response('responding for /bar'));
// router.get('.*/foo', request => handler(request));
// router.post('.*/foo.*', request => handler(request));
// router.get('/demos/router/foo', request => fetch(request)); // return the response from the origin

router.get(constants.HOME, resolvers.getHomepageResolver);
router.get(constants.GLOBBINGDIR, resolvers.getFoo2);
router.get(constants.GLOBBING, resolvers.getFoo);

async function routeHandler(request) {
  return router.route(request);
}

/**
 * Fetch trigger listener
 * implate with router design
 */
export const fetchListener = event => {
  const responsePromise = routeHandler(event.request);
  event.waitUntil(responsePromise);
  event.respondWith(responsePromise);
};

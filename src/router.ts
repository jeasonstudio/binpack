import { Router } from '@cfworker/web';
import * as homeResolvers from './resolvers/home';
import * as packageResolvers from './resolvers/package';
// import * as constants from './utils/constant';

export const router = new Router();
export const routerMiddleware = router.middleware;

// Add the homepage route.
router.get('/', homeResolvers.getHomepage);
router.get('/:packageName', packageResolvers.packageServe);


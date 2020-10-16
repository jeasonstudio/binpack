import { Resolver } from './IResolver';

export const getHomepage: Resolver = ctx => {
  ctx.res.body = `<div>Hello BinPack.</div>`;
};

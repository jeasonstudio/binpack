export const getHomepageResolver = async ctx => {
  console.log(ctx);
  ctx.response = new Response('Hello home1.');
};

export const getFoo = async ctx => {
  return new Response('Hello home2.');
};

export const getFoo2 = async ctx => {
  return new Response('Hello home3.');
};

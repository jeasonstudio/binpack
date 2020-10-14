export const getHomepageResolver = async request => {
  console.log(request.urlRegExp);
  return new Response('Hello home.');
};

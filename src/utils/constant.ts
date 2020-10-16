// module.exports = {
//   INDEX: /^\/?$/,
//   BROWSE_DIRECTORY: /^\/browse\/((?:.*))\/$/,
//   BROWSE_FILE: /^\/browse\/((?:.*))(?<!\/)$/,
//   META_DIRECTORY: /^\/meta\/((?:.*))\/$/,
//   META_FILE: /^\/meta\/((?:.*))(?<!\/)$/,
//   MODULE: /^\/module\/((?:.*))$/i,
//   PACK_DIRECTORY: /^\/pack\/((?:.*))\/$/,
//   PACK_FILE: /^\/pack\/((?:.*))(?<!\/)$/,
//   GLOBBINGDIR: /^((?:.*))\/$/i,
//   GLOBBING: /^(.*)$/,
// };

export const INDEX = /^\/?$/;
export const GLOBBING = /^(.*)$/;
export const GLOBBINGDIR = /^((?:.*))\/$/i;

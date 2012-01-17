/*!
 * Generic content-type parser
 * Extracted from Express - request
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

var mime = require('mime');

exports.is = function(ct, type) {
  if (!ct) return false;
  ct = ct.split(';')[0];
  if (!~type.indexOf('/')) type = mime.lookup(type);
  if (~type.indexOf('*')) {
    type = type.split('/');
    ct = ct.split('/');
    if ('*' == type[0] && type[1] == ct[1]) return true;
    if ('*' == type[1] && type[0] == ct[0]) return true;
    return false;
  }
  return !! ~ct.indexOf(type);
};

/*!
 * Crawl - differencer
 * Copyright(c) 2012 Mike Moulton <mike@meltmedia.com>
 * MIT Licensed
 */

var crawler = require('./crawler'),
    events = require('events'),
    util = require('util'),
    urlUtil = require('url'),
    first = require('first');

var differencer = new events.EventEmitter();

/**
 * differencer.diff
 *
 * Performs a difference check on two websites by crawling two url's, `leftUrl`
 * and `rightUrl`, comparing matching relative paths with one another.
 *
 * This is primarily only useful for determining changes between two versions
 * of the same website. For example, checking the changes between a production
 * site and a staging version.
 *
 * This function also supports several `options`:
 *   - headers {Boolean}: include the raw http headers from the response in the results
 *   - body {Boolean}: include the http response body in results
 *   - patch {Boolean}: generate a patch from the left into the right, representing the differences (todo)
 *
 * This function is asyncronous and requires a `callback` with the following signature:
 *   - function(err, leftPages, rightPages, differences)
 *
 * where `leftPages` and `rightPages` is an array with the following object structure for each result:
 *
 *   {
 *     url: URL Object provided from Node URL parser,
 *     checksum: SHA 256 hash of the response body,
 *     links: Array of links found on this page,
 *     body: The response body (optional),
 *     headers: The response headers (optional),
 *     date: Timestamp of the page crawl
 *   }
 *
 * and where `differences` is an object with the following structure:
 *   {
 *     'the relative conponent of the URL crawled': {
 *       left: {
 *         url: URL Object provided from Node URL parser,
 *         checksum: the SHA 256 checksum of the left page
 *       },
 *       right: {
 *         url: URL Object provided from Node URL parser,
 *         checksum: the SHA 256 checksum of the right page
 *       },
 *       differences: {Boolean} if difference were found,
 *       patch: (optional) a patch representing the differences found
 *     }
 *   }
 *
 * @param {String} http(s) url of the first site to crawl,
 *                 or filesystem path to JSON file to import
 * @param {String} http(s) url of the sedond site to crawl,
 *                 or filesystem path to JSON file to import
 * @param {Object} options (optional)
 * @param {Function} callback -- function(err, leftPages, rightPages, differences)
 * @api public
 */
 differencer.diff = function(leftUrl, rightUrl, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  var leftPages, rightPages;

  first(function() {
    var that = this;
    crawler.crawl(leftUrl, options, function(err, pages) {
      if (err) callback(err);

      leftPages = pages;
      that();
    });
  })
  .whilst(function() {
    var that = this;
    crawler.crawl(rightUrl, options, function(err, pages) {
      if (err) callback(err);

      rightPages = pages;
      that();
    });
  })
  .then(function() {
    // perform diff
    var differences = {};
    analyze(leftPages, true, options, differences);
    analyze(rightPages, false, options, differences);
    callback(null, leftPages, rightPages, differences);
  });

}

/**
 * analyze
 *
 * Utility function to analyze the pages and look for differences
 *
 * @param {Object} object representing the first site crawled,
 * @param {Boolean} if the object represents the left side,
 * @param {Object} options (optional)
 * @param {Function} callback -- function(err, leftPages, rightPages, differences)
 * @api private
 */
var analyze = function(pages, isLeft, options, differences) {
  pages.forEach(function(page) {
    var url = urlUtil.parse(page.url, true);
    var relative = url.path || '/';
    var type = (isLeft) ? 'left' : 'right';
    var inverseType = (isLeft) ? 'right' : 'left';

    if (differences[relative]) {
      differences[relative][type].url = page.url;
      differences[relative][type].checksum = page.checksum;
      differences[relative].differences = (page.checksum == differences[relative][inverseType].checksum) ? false : true;
      // generate a patch of the left into the right
      if (options.patch) {
        // todo
        var patch = "";
        differences[relative].patch = patch;
      }
    } else {
      differences[relative] = {
        left: {},
        right: {},
        differences: true,
        patch: null
      };
      differences[relative][type] = {
        url: page.url,
        checksum: page.checksum
      };
    }
  });
}

module.exports = differencer;

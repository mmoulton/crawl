/*!
 * Crawl - crawler
 * Copyright(c) 2012 Mike Moulton <mike@meltmedia.com>
 * MIT Licensed
 */

var events = require("events"),
    Crawler = require('simplecrawler').Crawler,
    hash = require('node_hash'),
    _ = require('underscore'),
    fs = require("fs"),
    util = require("util"),
    urlUtil = require('url');

var crawler = new events.EventEmitter();

/**
 * crawler.crawl
 *
 * Crawls a website, starting at `url`, finding all linked pages within the same domain.
 * The `url` can also be a filesystem path containing a stringified JSON object of a past crawl. This
 * can be generated using the included CLI and the '--json' option.
 *
 * This function also supports several `options`:
 *   - headers {Boolean}: include the raw http headers from the response in the results
 *   - body {Boolean}: include the http response body in results
 *
 * This function is asyncronous and requires a `callback` with the following signature:
 *   - function(err, pages)
 * where `pages` is an array with the following object structure for each result:
 *   {
 *     url: URL Object provided from Node URL parser,
 *     status: HTTP status code,
 *     contentType: the MIME type for the resource,
 *     checksum: SHA 256 hash of the response body,
 *     links: Array of links found on this page,
 *     referrers: Array of URLs within the crawled site who referr to this page,
 *     body: The response body (optional),
 *     headers: The response headers (optional),
 *     date: Timestamp of the page crawl
 *   }
 *
 * @param {String} http(s) url of site to crawl, or filesystem path to JSON file to import
 * @param {Object} options (optional)
 * @param {Function} callback -- function(err, pages)
 * @api public
 */
crawler.crawl = function(url, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // setup some default options for the node.io job
  options['crawler'] = crawler;

	var pages = {},
      potentialPages = {},
      urlParts = urlUtil.parse(url, true);

  // do a web crawl of url if it's an http protocol
	if (urlParts.protocol == "https:" || urlParts.protocol == "http:") {

    var port = urlParts.port ? urlParts.port : 80,
        siteCrawler = new Crawler(urlParts.hostname, urlParts.path, port);

    // configure crawler
    siteCrawler.interval = 10;
    siteCrawler.maxConcurrency = 10;
    siteCrawler.scanSubdomains = true;
    siteCrawler.downloadUnsupported = false;

    if (options.username && options.password) {
      siteCrawler.needsAuth = true;
      siteCrawler.authUser = options.username;
      siteCrawler.authPass = options.password;
    }

    function mimeTypeSupported(MIMEType) {
      var supported = false;
      siteCrawler.supportedMimeTypes.forEach(function(mimeCheck) {
        if (!!mimeCheck.exec(MIMEType)) {
          supported = true;
        }
      });
      return supported;
    }

    var pageHandler = function(queueItem, responseBuffer, response) {
      if (mimeTypeSupported(queueItem.stateData.contentType)) {
        crawler.emit("crawl", queueItem.url);

        var data = responseBuffer.toString(),
            parsedUrl = urlUtil.parse(queueItem.url, true),
            page = {};

        page.url = queueItem.url;
        page.status = queueItem.stateData.code;
        page.contentType = queueItem.stateData.contentType;
        page.checksum = hash.sha256(data);
        page.date = new Date().toJSON();

        if (options.headers) page.headers = queueItem.stateData.headers;
        if (options.body) page.body = data;

        if (potentialPages[parsedUrl.path]) {
          page = _.extend(page, potentialPages[parsedUrl.path]);
        }

        pages[parsedUrl.path] = page;
      }
    };

    siteCrawler.on("discoverycomplete", function(queueItem, resources) {
      var parsedUrl = urlUtil.parse(queueItem.url, true);

      // Save the outbound links for the item that just completed discovery
      pages[parsedUrl.path].links = resources;

      // Update each linked to page storing us as a referrer
      resources.forEach(function(link) {
        // A normalized, resolved URL, used for uniq identification purposes
        var resourceUrl = urlUtil.parse(urlUtil.resolve(parsedUrl, urlUtil.parse(link, true)), true);

        // Links found in the discovery of this resource may not have been crawled yet.
        // In the case of links that have not yet been crawled, we save them as potential
        // pages that may meet the crawling criteria (content-type,etc).
        if (!pages[resourceUrl.path]) {
          if (!potentialPages[resourceUrl.path]) potentialPages[resourceUrl.path] = { referrers: [] };
          potentialPages[resourceUrl.path].referrers.push(queueItem.url);

        // Otherwise the resourece has already been crawled so we can store ourselves as a referrer.
        } else {
          if (!pages[resourceUrl.path].referrers) pages[resourceUrl.path].referrers = [];
          pages[resourceUrl.path].referrers.push(queueItem.url);
        }
      });
    });

    // handle normal pages
    siteCrawler.on("fetchcomplete", pageHandler);

    // handle broken links
    siteCrawler.on("fetch404", pageHandler);

    // on completion, parse broken links and report
    siteCrawler.on("complete", function(queueItem, responseBuffer, response) {
      callback(null, _.map(pages, function (value, key) {
        // De-Dup referrers. Note: this could be done much more efficiently if performance
        // becomes a problem.
        if (value.referrers) value.referrers = _.uniq(value.referrers);
        return value;
      }));
    });

    siteCrawler.start(); // crawl the site

	}

  // otherwise we load a json file, assumed to be generated by the CLI using the '--json' option
  else if (urlParts.path) {
    var path = urlParts.path;
    try {
      if (fs.statSync(path).isFile()) {
        fs.readFile(path, function(err, data) {
          if (err) callback(err);

          var pages = JSON.parse(data);
          callback(null, pages);
        });
      }
    }
    catch (err) {
      callback(err);
    }
  }

  else {
    callback("Unable to interperate url as path or web address: %s", url);
  }

};

module.exports = crawler;

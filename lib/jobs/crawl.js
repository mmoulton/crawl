/*!
 * Crawl - node.io crawl job
 * Copyright(c) 2012 Mike Moulton <mike@meltmedia.com>
 * MIT Licensed
 */

var nodeio = require('node.io'),
    first = require('first'),
    urlUtil = require('url'),
    hash = require('node_hash'),
    util = require('util'),
    _ = require('underscore'),
    ct = require('../content-type');

var crawl = exports.job = new nodeio.Job({max: 50, retries: 3, auto_retry: true, timeout: 30}, {

  init: function() {
    this.options.cache = {};
    this.options.baseUrl = undefined;
  },

  run: function (url) {

    this.options.crawler.emit("crawl", url);

    var urlParts = urlUtil.parse(url, true);

    // Remember the first URL crawled so we can restrict all mined links to the same host
    if (!this.options.baseUrl) {
      this.options.baseUrl = urlParts;
    }

    this.getHtml(url, function(err, $, data, headers) {

      if (ct.is(headers['content-type'], 'text/html')) {

        var links = [],
            newLinks = [],
            that = this;

        first(function() {

          // Scan for anchor links to add
          try {
            $('a').each('href', function(href) {
              links.push(href);
              var hrefParts = urlUtil.parse(href, true);
              if (!that.options.cache[hrefParts.path]) {
                var newLink;

                // absolute link within domain
                if (hrefParts.path && hrefParts.host === that.options.baseUrl.host) {
                  newLink = urlUtil.format(hrefParts); // should we do this, or use the baseUrl?

                // relative link
                } else if (hrefParts.path && !hrefParts.host) {
                  var baseUrl = _.clone(that.options.baseUrl);
                  baseUrl.path = hrefParts.path;
                  baseUrl.pathname = hrefParts.pathname;
                  newLink = urlUtil.format(baseUrl);
                }

                if (newLink) {
                  that.options.cache[hrefParts.path] = true;
                  newLinks.push(newLink);
                }

              }

            });
          } catch (e) {
            // ignore and keep processing
            // - catches errors such as "No elements matching 'A'"
          }

          // We're done mining links, move along
          this();

        }).then(function() {

          that.add(newLinks);

          var page = {
            url: urlParts,
            checksum: hash.sha256(data),
            links: links,
            date: new Date().toJSON()
          };
          if (that.options.headers) page.headers = headers;
          if (that.options.body) page.body = data;

          // Output the page for further processing
          that.emit(page);

        });

      } else {
        this.skip();
      }

    });

  }

});
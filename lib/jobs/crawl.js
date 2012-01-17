/*!
 * Crawl - node.io crawl job
 * Copyright(c) 2012 Mike Moulton <mike@meltmedia.com>
 * MIT Licensed
 */

var nodeio = require('node.io'),
    first = require('first'),
    uri = require('uri-parser'),
    hash = require('node_hash'),
    util = require('util'),
    ct = require('../content-type');

var crawl = exports.job = new nodeio.Job({max: 50, retries: 3, auto_retry: true, timeout: 30}, {

  init: function() {
    this.options.cache = {};
    this.options.baseUrl = undefined;
  },

  run: function (url) {

    this.options.crawler.emit("crawl", url);

    var urlParts = uri.parse(url);

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
              var hrefParts = uri.parse(href);
              if (!that.options.cache[hrefParts.relative]) {
                var newLink;

                // absolute link within domain
                if (hrefParts.relative && hrefParts.host == that.options.baseUrl.host) {
                  newLink = uri.format(hrefParts); // should we do this, or use the baseUrl?

                // relative link
                } else if (hrefParts.relative && !hrefParts.host) {
                  newLink = "".concat(uri.format(that.options.baseUrl), hrefParts.relative);
                }

                if (newLink) {
                  that.options.cache[hrefParts.relative] = true;
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
            url: {
              authority: urlParts.authority,
              protocol: urlParts.protocol,
              relative: urlParts.relative
            },
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
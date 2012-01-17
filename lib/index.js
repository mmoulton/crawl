/*!
 * Crawl - index
 * Copyright(c) 2012 Mike Moulton <mike@meltmedia.com>
 * MIT Licensed
 */

var crawler = require("./crawler"),
	differencer = require("./differencer");

exports.crawl = crawler.crawl;
exports.diff = differencer.diff;

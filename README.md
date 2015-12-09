# Crawl - a website crawler / differencer [![Build Status](https://travis-ci.org/mmoulton/crawl.png)](https://travis-ci.org/mmoulton/crawl)

**NOTE:** This project is no longer being maintained by me. If you are interested in taking over maintenance of this project, let me know.

Crawl, as it's name implies, will crawl around a website, discovering all of the links and their relationships starting from a base URL. The output of crawl is a JSON object representing a sitemap of every resource within a site, including each links outbound references and any inbound refferers.

Crawl is a Node.js based library that can be used as a module within another application, or as a stand alone tool via it's command line interface (CLI).

## Install

To install crawl you must first have both Node.js and NPM installed, both of which are outside the scope of this tool. See the [Node.js Website](http://nodejs.org) for details on how to install Node.js. Personaly I am found of Tim Caswell's excelent [NVM](https://github.com/creationix/nvm) tool for insalling and managing node.

Once NPM is installed, simply install Crawl by executing the following from the command line:

	npm install crawl -g


## Command Line Usage

Once installed, you can explore what crawl can do by simply typing `crawl` into the command line. You will get the built in help that looks something like this:

	Usage: crawl left [right]

	Options:
		-v, --verbose  Verbose logging                                  [boolean]
		-P, --pretty   Pretty print the results                         [boolean]
		-H, --headers  Include the raw response headers in the results  [boolean]
		-b, --body     Include the raw response body in the results     [boolean]
		-u, --username HTTP Basic Auth Username                         [string]
		-p, --password HTTP Basic Auth Password                         [string]

Executing `crawl http://your-domain.com` will produce results similar to:

	[
	  {
	    "url": "http://your-domain.com/",
	    "status": 200,
	    "contentType": "text/html",
	    "checksum": "6959d6e6066e97c3f94a96fb8e5909f4025b27508a09416ac680118953a542b2",
	    "date": "2013-01-22T22:10:39.404Z",
	    "links": [
	      "/css/boilerplate.css",
	      ...
	      "http://vimeo.com/your-domain"
	    ],
	    "referrers": [
	      "http://your-domain.com/",
	      ...
	      "http://your-domain.com/about/"
	    ]
	  },
	  ...
	  {
	    "url": "http://your-domain.com/about/",
	    "status": 200,
	    "contentType": "text/html; charset=UTF-8",
	    "checksum": "cac058cba6f9ba7f5de33f6a3ee07f5442c9cdf5d074a3fdb5e7247a211372a5",
	    "date": "2013-01-22T22:10:39.636Z",
	    "referrers": [
	      "http://your-domain.com/",
	      ...
	      "http://your-domain.com/blog/"
	    ],
	    "links": [
	      "/",
	      ...
	      "/blog/"
	    ]
	  }
	]

## Programatic Use

Crawl is rather simple to use in your own code. Simple include crawl as a dependency of your project (add to package.json, etc) then integrate like so:

	var crawl = require('crawl');

	crawl.crawl("http://your-domain.com", function(err, pages) {
		if (err) {
			console.error("An error occured", err);
			return;
		}

		console.log(JSON.stringify(pages));
	});

## Example Use Cases

The most basic use case for crawl is to crawl a site and use the resulting JSON object as input to another process. See [Capture](http://github.com/mmoulton/capture) for an example of a tool that can consume the output of Crawl to generate screenshots of every page in a website.

For example, you may crawl and generate screenshots of a site using `crawl` and `capture` by executing the following:

	crawl http://your-domain.com | capture

This will crawl your base url, discovering each page, then feed that to PhantomJS to generate a screenshot of each URL, placing it in the current working directory.

## The MIT License

Copyright (c) Mike Moulton

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

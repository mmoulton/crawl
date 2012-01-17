/*!
 * Crawl - crawler
 * Copyright(c) 2012 Mike Moulton <mike@meltmedia.com>
 * MIT Licensed
 */

var crawl = require('../'),
    should = require('should'),
    http = require('http');

var httpServer;

describe('crawler', function() {

  before(function(done) {
    httpServer = http.createServer(function (req, res) {
      res.writeHead(200, {'Content-Type': 'text/html'});
      res.end('<html><body><h1>Hello World</h1></body></html>\n');
    }).listen(8899, "127.0.0.1");
    done();
  });

  describe('#crawl()', function() {

    it('should crawl site and return 1 page', function(done) {
      crawl.crawl("http://127.0.0.1:8899", function(err, pages) {
        pages.should.have.lengthOf(1);
        done();
      });
    });

    it('should import site json and return 1 page', function(done) {
      crawl.crawl(__dirname + "/assets/json/site1-left.json", function(err, pages) {
        pages.should.have.lengthOf(1);
        done();
      });
    });

  });

  describe('#diff()', function() {

    it('should difference 2 sites and return 1 page with no differences', function(done) {
      crawl.diff("http://127.0.0.1:8899", "http://127.0.0.1:8899", function(err, leftPages, rightPages, diffs) {
        diffs.should.be.a('object').and.have.property('/');
        diffs['/'].differences.should.be.false;
        done();
      });
    });

    it('should difference 2 sites from json and return 1 page with no differences', function(done) {
      crawl.diff(__dirname + "/assets/json/site1-left.json",
                 __dirname + "/assets/json/site1-right.json",
                 function(err, leftPages, rightPages, diffs) {
        diffs.should.be.a('object').and.have.property('/');
        diffs['/'].differences.should.be.false;
        done();
      });
    });

    it('should difference 2 sites from json and return 1 page with no differences', function(done) {
      crawl.diff(__dirname + "/assets/json/site2-left.json",
                 __dirname + "/assets/json/site2-right.json",
                 function(err, leftPages, rightPages, diffs) {
        diffs.should.be.a('object').and.have.property('/');
        diffs['/'].differences.should.be.true;
        done();
      });
    });

  });
  
});



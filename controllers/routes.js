// Import the Comment and Article models
// Require all models
var db = require("../models");
var express = require("express");
var axios = require("axios");
var cheerio = require("cheerio");
var request = require("request");
var logger = require('morgan');
var path = require('path');
var router = express.Router();
var bodyParser = require("body-parser");
//

router.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.echojs.com/", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    var promises = [];
    var newArticles = [];

    // Now, we grab every h2 within an article tag, and do the following:
    $("article h2").each(function(i, element) {
      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
      // console.log(result)
      // Create a new Article using the `result` object built from scraping

      promises.push(
        db.Article
        .create(result)
        .then(function(dbArticle) {
          console.log("Created content: " + JSON.stringify(result))
          // we have a closure on the result, and the newArticles array above,
          // so we can simply push the new result value since it was successfully
          // created in the DB
          newArticles.push(result);
          return result;
        })
        .catch(function(err) {
          if (err.code === 11000) {
            console.log("Found a duplicate article, did not create in DB...\n");
          } else {
            console.log("Ran into an unknown error...\n" + err);
          }
          return null;
        })
      )
    });

    // once all of the promises resolve, we send back the response with the
    // newly created data
    Promise.all(promises).then(function(values) {
      console.log("All promises resolved\n" + JSON.stringify(values));
      res.json(newArticles);
    })

  });



});
//
// Route for getting all Articles from the db
router.get("/", function(req, res) {
  // Grab every document in the Articles collection
  db.Article
    .find({})
    .populate('notes')
    .then(function(dbArticles) {
      // If we were able to successfully find Articles, send them back to the client
      console.log(JSON.stringify(dbArticles), indent=2)
      res.render("index", {
        articles: dbArticles
      });
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});



// Route for saving/updating an Article's associated Note
router.post("/comments/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note
    .create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate(
        { _id: req.params.id },
        {$push: {notes: dbNote._id}})
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// A GET route for scraping the echojs website

module.exports = router;

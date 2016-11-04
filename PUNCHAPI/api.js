"use strict";

const express = require("express");
const app = express();
const entities = require("./entities");
const uuid = require("node-uuid");
var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
var elasticsearch = require('elasticsearch');
var adminToken = "Batman";
var contentType = "application/json";

const client = new elasticsearch.Client({
  host: "localhost:9200",
  log: "error"
});
/**
* Fetches a list of companies that have been added to MongoDB
*/
app.get("/companies", function GetCompanies(req, res) {
  //Set the page to 0 as default
  const page = req.query.page || 0;
  const size = req.query.max || 20;
  const search = req.query.search || "";

  var queryString;
  if(search == "")
  {
    queryString = {
      match_all : {}
    };
  }
  else {
    queryString = {
      match:{
        _all : search,
      }
    }
  }
  console.log(queryString);
  const promise = client.search({
    index: "companies",
    from : page,
    size : size,
    type: 'company',
    body:{
      query: queryString,
      sort: { 'name.keyword' : { order: 'asc'} },
    }
  });
  promise.then((searchesdoc) => {
    res.json(searchesdoc.hits.hits.map(search => {
      return{
        id: search._id,
        name: search._source.name
      };
    }));
  }
  , (err) =>{
    console.log("Most likely nothing in database!");
    res.statusCode = 500;
    return res.json("Server error");
  });
});
/**
* Fetches a given company that has been added to MongoDB by id.
* if the the we can not finde the id of the company in the db we return 404
*/
app.get("/companies/:id", function (req, res) {
  entities.Company.find({ _id: req.params.id }, function (err, docs) {
    if (err) {
      res.statusCode = 404
      return res.json("Not found");
    }
    else {
      if (docs != null && docs.length > 0) {
        var company = {
          _id: docs[0]._id,
          name: docs[0].name,
          punchCount: docs[0].punchCount,
          description: docs[0].description
        }
        res.json(company);
      }
    }
  });
});
/**
* Allows administrators to add new companies to MongoDB
*/
app.post("/companies", jsonParser, function (req, res) {
  if (req.headers.authorization !== adminToken) {
    res.statusCode = 401;
    return res.json("Not Authorized");
  }
  if(req.get('Content-Type') !== contentType)
  {
    res.statusCode = 415;
    return res.json("Unsupported Media Type");
  }
  entities.Company.find({ name: req.body.name }, function (err, docs) {
    if(docs[0] != null)
    {
      if(docs[0].name !== undefined )
      {
        res.statusCode = 409;
        return res.json("Conflict");
      }
    }
    //No company found
    if(err || err == null)
    {
      //Else we can add a company
      var Company = {
        name: req.body.name,
        punchCount: req.body.punchCount,
        description: req.body.description
      };
      var entity = new entities.Company(Company);
      entity.validate(function (err) {
        if (err) {
          res.statusCode = 412;
          return res.json("Precondition failed");
        }
        entity.save(function (err) {
          if (err) {
            res.statusCode = 500;
            return res.json("Server error");
          }
          else {
            const promise = client.index({
              index: "companies",
              type: "company",
              id: String(entity._id),
              body: {
                "id": entity._id,
                "name": Company.name,
                "punchCount": Company.punchCount,
                "description": Company.description
              }
            });
            promise.then((doc) => {
              res.statusCode = 201;
              return res.json({
                _id: entity._id,
              });
            },(err) => {
              console.log(err);
              res.statusCode = 500;
              return res.json("Server error");
            });
          }
        });
      });
    }
  });
});

module.exports = app;

const express = require('express');
const mongoose = require("mongoose");
const app = express();
const api = require('./api');
const port = 1337;

app.use('/api', api);
mongoose.connect("localhost/punchapi");
mongoose.connection.once("open", function(){
      console.log("Connected To database");
      app.listen(port, function() {
          console.log("Web server has started on port " + port);
      });
});

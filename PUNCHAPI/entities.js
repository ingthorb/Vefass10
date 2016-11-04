const mongoose = require("mongoose");




/**
* Documents representing companies that have been added to the system and can give out punch cards.
* name: String for the company name
* punchCount: The number of punches a user needs to obtain in order to be given a discount
*/
const CompaniesScheme = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  punchCount: {
    type: Number,
    required: true,
    default: 10
  },
  description: {
    type: String,
    required:true
  }
});


const CompanyEntity = mongoose.model("Companies", CompaniesScheme);

const entities = {
  Company: CompanyEntity
}

module.exports = entities;

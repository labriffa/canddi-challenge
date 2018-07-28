'use strict';

const request = require('request-promise');
const fs = require('fs');

/**
* A class responsible for extracting data from the Company House API
**/
class CompanyHouseApi {

  constructor(apiKey) {
    this.baseUrl = 'https://api.companieshouse.gov.uk';
    this.apiKey = apiKey;
  }

  searchCompany(id, success) {
    // load in sic code dataset
    const sicCodesList = JSON.parse(fs.readFileSync('sicCodes.json', 'utf8'));

    let options = {
      url: this.baseUrl + '/company/' + id,
      auth: { 'user': this.apiKey },
      transform: function(body) { return JSON.parse(body); },
      transform2xxOnly: true
    };

    request(options)
      .then(function (company) {

        let companyRegistration = {
          registeredName: '',
          companyNumber: '',
          companyType: '',
          registeredAddress: '',
          industries: new Set(),
        }

        companyRegistration.registeredName = company.company_name;
        companyRegistration.companyNumber = company.company_number;
        companyRegistration.registeredAddress = company.registered_office_address;
        companyRegistration.companyType = company.type;

        // add industry type
        company.sic_codes.forEach((sicCode) => {
          sicCodesList.forEach((sicCodeObj) => {
            if(sicCodeObj.sic_code == sicCode) {
              companyRegistration.industries.add(sicCodeObj.sic_description);
            }
          });
        });
                    
        success(companyRegistration);                  

    }, success)

      .catch(function (err) { console.log(''); });
  }

  searchOfficers(id, success) {
    let options = {
      url: this.baseUrl + '/company/' + id + '/officers',
      auth: { 'user': this.apiKey },
      transform: function(body) { return JSON.parse(body); },
      transform2xxOnly: true
    };

    request(options)
      .then(function (officers) {

        officers.items.forEach((officer) => {
          delete officer.links;
        });
                    
        success(officers.items);                  

    }, success)

    .catch(function (err) { console.log(''); });
  }
}

module.exports = CompanyHouseApi;
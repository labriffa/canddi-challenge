'use strict';

const COMPANY_NO_REGEX = /[0-9]{8}/g;

/**
* A class responsible for working with company information
**/
class CompanyLib {

 	/**
  	* Extracts the email domain from a given email address
  	*
  	* @param  {string}  text corpus
  	* @param  {object}  a given object to push company registration numbers to 
  	**/
	static extractCompanyRegNumbers(text, obj) {
    const companyRegNo = text.match(COMPANY_NO_REGEX);
    if(companyRegNo) {
      for(var i = 0; i < companyRegNo.length; i++) {
        obj.add(companyRegNo[i]);
      }
    }
	}
}

module.exports = CompanyLib;
'use strict';

/**
* A class responsible for parsing and extracting emails
**/
class EmailLib {

 	/**
  	* Extracts the email domain from a given email address
  	*
  	* @param  {string}  the email address in question
  	* @return {string}  the email domain associated with the provided email address
  	**/
	static extractDomain(email) {
		return email.split('@')[1];
	}
}

module.exports = EmailLib;
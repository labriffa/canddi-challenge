'use strict';

const EMAIL_REGEX = /(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/g;

/**
* A class responsible for parsing and extracting email addresses
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

  /**
    * Extracts email addresses using a given knwl instance
    *
    * @param  {object}  knwl instance
    * @param  {object}  a given object to push email addresses to
    **/
  static extractEmails(knwlInstance, obj) {
    const emails = knwlInstance.get('emails').map(({ address }) => address);
    for(let i = 0; i < emails.length; i++) { 
      obj.emails.add(emails[i]); 
    }
  }

	/**
  	* Detect whether or not an email address is valid 
  	*
  	* @param  {string}  the email address in question
  	* @return {boolean}  whether the email is valid
  	**/
	static isValid(email) {
    	return EMAIL_REGEX.test(email);
  	}
}

module.exports = EmailLib;
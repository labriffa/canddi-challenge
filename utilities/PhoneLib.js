'use strict';

/**
* A class responsible for parsing and extracting phone numbers
**/
class PhoneLib {

 	/**
    * Extracts international phone numbers using a given knwl instance
    *
    * @param  {object}  knwl instance
    * @param  {object}  a given object to push phone numbers to
    **/
  static extractInternationalPhones(knwlInstance, obj) {
    const internationalPhones = knwlInstance.get('internationalPhones').map(({ number }) => number);
    for(let i = 0; i < internationalPhones.length; i++) { 
      obj.phones.add(internationalPhones[i]); 
    }
  }

  /**
    * Extracts non-international phone numbers using a given knwl instance
    *
    * @param  {object}  knwl instance
    * @param  {object}  a given object to push phone numbers to
    **/
  static extractPhones(knwlInstance, obj) {
    const phones = knwlInstance.get('phones').map(({ phone }) => phone);
    for(let i = 0; i < phones.length; i++) {
      obj.phones.add(phones[i]); 
    }
  }
}

module.exports = PhoneLib;
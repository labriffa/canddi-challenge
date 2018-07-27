'use strict';

const ADDRESS_REGEX = /\d{1,3}.?\d{0,3}\s[a-zA-Z]{2,30}\s[A-Z]{1}[a-zA-Z]{1,15}.+(([G][I][R] 0[A]{2})|((([A-Z][0-9]{1,2})|(([A-Z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-Ha-hJ-Yj-y][0-9]?[A-Z]))))\s?[0-9][A-Z]{2}))/g;
const POSTCODE_REGEX = /(([G][I][R] 0[A]{2})|((([A-Z][0-9]{1,2})|(([A-Z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-Ha-hJ-Yj-y][0-9]?[A-Z]))))\s?[0-9][A-Z]{2}))/g;

/**
* A class responsible for parsing and extracting addresses
**/
class PlaceLib {

 	  /**
    * Extracts addresses using a given text corpus
    *
    * @param  {string}  text corpus
    * @param  {object}  a given object to push addresses to
    **/
    static extractPlaces(text, obj) {
      const places = text.match(ADDRESS_REGEX);
      if(places) {
        for(var i = 0; i < places.length; i++) {
          obj.places.add(places[i]);
      }
    }
  }

  /**
  * Extracts postcodes using a given text corpus
  *
  * @param  {object}  text corpus
  * @param  {object}  a given object to push postcodes to
  **/
  static extractPostcodes(text, obj) {
    const postcodes = text.match(POSTCODE_REGEX);
    if(postcodes) {
      for(var i = 0; i < postcodes.length; i++) {
        obj.postcodes.add(postcodes[i]);
      }
    }
  }
}

  module.exports = PlaceLib;
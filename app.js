'use strict';

// Dependencies -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
const request = require('request-promise');
const cheerio = require('cheerio');
const Knwl = require('knwl.js');

// Configure Knwl
const knwlInstance = new Knwl('english');
// Register experimental Knwl plugins
knwlInstance.register('internationalPhones', require('./plugins/knwl/internationalPhones.js'));

// Utilities -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const EmailLib = require('./utilities/EmailLib');

const options = {
	method: 'GET',
	uri: 'https://www.canddi.com/privacy/'
};

request(options)
	.then((response) => {

		// run initial knwl parser functions
		knwlInstance.init(response);		

		// get emails
		const emails = knwlInstance.get('emails');

		// get international phone numbers
		const internationalPhones = knwlInstance.get('internationalPhones');
		const uniqInternationalPhones = [...(new Set(internationalPhones.map(({ number }) => number)))];
	})
	.catch((error) => {
		console.log(error);
	});

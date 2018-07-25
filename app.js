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
	uri: 'http://www.thomaswillmax.co.uk/contact-us/'
};

request(options)
	.then((response) => {
		const $ = cheerio.load(response);

		// remove conflicting tags
		$('head, script').remove();

		// use lookaround based regex to remove the spaces between digits
		const text = $.text().replace(/(?<=\d) +(?=\d)/g, '');

		knwlInstance.init(text);		

		// get emails
		const emails = knwlInstance.get('emails');
		const uniqEmails = [...new Set(emails.map(({ address }) => address))];

		// get international phone numbers
		const internationalPhones = knwlInstance.get('internationalPhones');
		const uniqInternationalPhonesSet = new Set(internationalPhones.map(({ number }) => number));

		// try interpreting non-internationalized numbers
		const phones = knwlInstance.get('phones');
		const uniqPhonesSet = new Set(phones.map(({ phone }) => phone));

		// combine both international and non-international numbers
		const uniqPhones = [...new Set([...uniqInternationalPhonesSet, ...uniqPhonesSet])];
	})
	.catch((error) => {
		console.log('Unable to parse');
	});

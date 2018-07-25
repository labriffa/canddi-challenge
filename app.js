'use strict';

// Dependencies -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
const request = require('request-promise');
const cheerio = require('cheerio');
const Knwl = require('knwl.js');

// Configure Knwl
const knwlInstance = new Knwl('english');

// Utilities -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const EmailLib = require('./utilities/EmailLib');

const options = {
	method: 'GET',
	uri: 'https://www.canddi.com/privacy/'
};

request(options)
	.then((response) => {
		const $ = cheerio.load(response);

		// run initial knwl parser functions
		knwlInstance.init(response);

		const emails = knwlInstance.get('emails');
	})
	.catch((error) => {
		console.log(error);
	});
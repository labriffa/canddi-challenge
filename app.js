'use strict';

// Dependencies -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
const request = require('request-promise');
const cheerio = require('cheerio');
const Knwl = require('knwl.js');
const Crawler = require("simplecrawler");
const url = require('url');

// Configure Knwl
const knwlInstance = new Knwl('english');
// Register experimental Knwl plugins
knwlInstance.register('internationalPhones', require('./plugins/knwl/internationalPhones.js'));

// Utilities -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const EmailLib = require('./utilities/EmailLib');

// Email Domain -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
const email = 'hello@canddi.com';
const base = EmailLib.extractDomain(email);
const domain = "http://www." + base;

// Start web server
var crawler = new Crawler(domain);
crawler.maxDepth = 2;

// Holds domain relevant information
const domainInfoObj = {
	emails: new Set(),
	phones: new Set(),
	places: new Set()
};

/**
* Handles the crawling process
**/
crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {

	// convert body 
    const body = responseBuffer.toString('utf8');
   	const $ = cheerio.load(body);

	// use lookaround based regex to remove the spaces between digits
	const text = $.text().replace(/(?<=\d) +(?=\d)/g, '');

	knwlInstance.init(text);		

	// Emails -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
	const emails = knwlInstance.get('emails').map(({ address }) => address);
	for(let i = 0; i < emails.length; i++) { 
		domainInfoObj.emails.add(emails[i]); 
	}


	// International Phone Numbers -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
	const internationalPhones = knwlInstance.get('internationalPhones').map(({ number }) => number);
	for(let i = 0; i < internationalPhones.length; i++) { 
		domainInfoObj.phones.add(internationalPhones[i]); 
	}


	// Try Interpreting Non-Internationalized Numbers -=-=-=-=-=-=-=-=-=-=-
	const phones = knwlInstance.get('phones').map(({ phone }) => phone);
	for(let i = 0; i < phones.length; i++) {
		domainInfoObj.phones.add(phones[i]); 
	}

	// Places -=-=-=-=-=-=-=-=-=-=-
	const ADDRESS_REGEX = /\d{1,3}.?\d{0,3}\s[a-zA-Z]{2,30}\s[A-Z]{1}[a-zA-Z]{1,15}.+(([G][I][R] 0[A]{2})|((([A-Z][0-9]{1,2})|(([A-Z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-Ha-hJ-Yj-y][0-9]?[A-Z]))))\s?[0-9][A-Z]{2}))/g;
	const places = cheerio.load(body).text().match(ADDRESS_REGEX);
	if(places) {
		for(var i = 0; i < places.length; i++) {
			domainInfoObj.places.add(places[i]);
		}
	}
});

/**
* Responsible for discovering URL links
**/
crawler.discoverResources = function(buffer, queueItem) {

	const $ = cheerio.load(buffer.toString("utf8"));

    // Map anchor tags so that relative links are visited.
    // All other links are irrelevant as simplecrawler ignores urls
    // from different domains
    return $("a[href]").map(function () {
    	const pat = /^https?:\/\//i;
    	if(!pat.test($(this).attr('href'))) {
    		return domain + $(this).attr("href");
    	} else {
    		return $(this).attr("href");
    	}
        
    }).get();
};

crawler.on("complete", function() {
	console.log(domainInfoObj);
});

// Start the crawling process
crawler.start();

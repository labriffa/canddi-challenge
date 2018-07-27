'use strict';

// Dependencies -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
const cheerio = require('cheerio');
const Knwl = require('knwl.js');
const Crawler = require("simplecrawler");
const url = require('url');
const request = require('request');
const fs = require('fs');

// Configure Knwl -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
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
let domainInfoObj = {
	emails: new Set(),
	phones: new Set(),
	places: new Set(),
	postcodes: new Set(),
	registeredName: '',
	companyNumber: '',
	companyType: '',
	registeredAddress: '',
	industries: new Set(),
	titles: new Set(),
};

let possibleCompanyNumbers = new Set();
// Crawler
var crawler = new Crawler(domain);
crawler.maxDepth = 2;

/**
* Handle the crawling process
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

	// Postcodes -=-=-=-=-=-=-=-=--=-=-=-=-=-=-=
	const POSTCODE_REGEX = /(([G][I][R] 0[A]{2})|((([A-Z][0-9]{1,2})|(([A-Z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Z][0-9][A-Z])|([A-Z][A-Ha-hJ-Yj-y][0-9]?[A-Z]))))\s?[0-9][A-Z]{2}))/g;
	const postcodes = cheerio.load(body).text().match(POSTCODE_REGEX);
	if(postcodes) {
		for(var i = 0; i < postcodes.length; i++) {
			domainInfoObj.postcodes.add(postcodes[i]);
		}
	}

	// Company Reg No. -=-=-=-=-=-=-=-=-=-=-=-=-=
	const COMPANY_NO_REGEX = /[0-9]{8}/g;
	const companyRegNo = cheerio.load(body).text().match(COMPANY_NO_REGEX);
	if(companyRegNo) {
		for(var i = 0; i < companyRegNo.length; i++) {
			possibleCompanyNumbers.add(companyRegNo[i]);
		}
	}

	// Page Titles -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
	domainInfoObj.titles.add($('title').text()); 

	console.log('Scraping Page: ' + $('title').text());
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

	// fetch company house data for each possible company house number
	if(possibleCompanyNumbers) {

		possibleCompanyNumbers.forEach((number) => {
		const options = {
		    url: 'https://api.companieshouse.gov.uk/company/' + number,
		    auth: {
		        'user': process.env.API_COMPANIES_HOUSE_KEY,
		    }
		};

		function callback(error, response, body) {
		    if (!error && response.statusCode == 200) {
		        const company = JSON.parse(body);

		        // cross reference collated postcodes with company house data
		        if(domainInfoObj.postcodes.has(company.registered_office_address.postal_code)) {
		        	domainInfoObj.registeredName = company.company_name;
			        domainInfoObj.companyNumber = company.company_number;
			        domainInfoObj.registeredAddress = company.registered_office_address;
			        const sicCodes = company.sic_codes;

			        for(let i = 0; i < sicCodes.length; i++) {
			        	const sicCodesList = JSON.parse(fs.readFileSync('sicCodes.json', 'utf8'));
						sicCodesList.forEach((sicCodeObj) => {
							if(sicCodeObj.sic_code == sicCodes[i]) {
								domainInfoObj.industries.add(sicCodeObj.sic_description);
							}
						});
			        }
			        domainInfoObj.companyType = company.type;
		        }       

		        displayResults();
		    }
		}

			request(options, callback);

		});
	} else {
		displayResults();
	}
});

function displayResults() {
	console.log('\n\n\n/ Final Scraping -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-\n\n');
	console.log(domainInfoObj);
	console.log('\n\n-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=- / Final Scraping ');
}

// Start the crawling process
crawler.start();
// Try crawling sitemap
crawler.queueURL(domain + '/sitemap');

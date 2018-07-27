'use strict';

// Dependencies -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
const cheerio = require('cheerio');
const Knwl = require('knwl.js');
const Crawler = require("simplecrawler");
const url = require('url');
const request = require('request-promise');
const fs = require('fs');

// Configure Knwl -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const knwlInstance = new Knwl('english');
// Register experimental Knwl plugins
knwlInstance.register('internationalPhones', require('./plugins/knwl/internationalPhones.js'));

// Utilities -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const EmailLib = require('./utilities/EmailLib');
const PhoneLib = require('./utilities/PhoneLib');
const PlaceLib = require('./utilities/PlaceLib');
const CompanyLib = require('./utilities/CompanyLib');

// Email Domain -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
const email = process.argv[2];

// Check validity of email address 
if(!EmailLib.isValid(email)) {
	console.log('Invalid email address');
	process.exit();
}

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
	titles: new Set(),

	companyRegistration: {
		registeredName: '',
		companyNumber: '',
		companyType: '',
		registeredAddress: '',
		industries: new Set(),
	}
};

let possibleCompanyNumbers = new Set();
// Crawler
var crawler = new Crawler(domain);
crawler.maxDepth = 2;

/**
* Handle the crawling process
**/
crawler.on("fetchcomplete", function(queueItem, responseBuffer, response) {

	// Convert body 
    const body = responseBuffer.toString('utf8');
   	const $ = cheerio.load(body);

	// Use lookaround based regex to remove the spaces between digits
	const text = $.text().replace(/(?<=\d) +(?=\d)/g, '');

	knwlInstance.init(text);		

	// Extract -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
	EmailLib.extractEmails(knwlInstance, domainInfoObj);
	PhoneLib.extractInternationalPhones(knwlInstance, domainInfoObj);
	PhoneLib.extractPhones(knwlInstance, domainInfoObj);
	PlaceLib.extractPlaces(cheerio.load(body).text(), domainInfoObj);
	PlaceLib.extractPostcodes(cheerio.load(body).text(), domainInfoObj);
	CompanyLib.extractCompanyRegNumbers(text, possibleCompanyNumbers);	

	// Page Titles -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
	const pageTitle = $('title').text();
	if(pageTitle) { domainInfoObj.titles.add($('title').text()); }
	
	// Crawler Progress -=-=-=-=-=-=-=-=-=-=-=-=-
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

		// fetch company house data for each reg no. found
		possibleCompanyNumbers.forEach((number) => {

			// load in sic code dataset
			const sicCodesList = JSON.parse(fs.readFileSync('sicCodes.json', 'utf8'));

			var options = {
			    url: 'https://api.companieshouse.gov.uk/company/' + number,
				auth: {
					'user': process.env.API_COMPANIES_HOUSE_KEY,
				},
				transform: function(body) {
					return JSON.parse(body);
				},
				transform2xxOnly: true
			};

			request(options)
			    .then(function (company) {
			    	
			    		// cross reference collated postcodes with company house data
				        if(domainInfoObj.postcodes.has(company.registered_office_address.postal_code)) {
				        	domainInfoObj.companyRegistration.registeredName = company.company_name;
					        domainInfoObj.companyRegistration.companyNumber = company.company_number;
					        domainInfoObj.companyRegistration.registeredAddress = company.registered_office_address;
					        domainInfoObj.companyRegistration.companyType = company.type;

					        // add industry type
					        company.sic_codes.forEach((sicCode) => {
								sicCodesList.forEach((sicCodeObj) => {
									if(sicCodeObj.sic_code == sicCode) {
										domainInfoObj.companyRegistration.industries.add(sicCodeObj.sic_description);
									}
								});
					        });
					    
					        
					        displayResults();
					        
				        }    
			    	
			    })
			  .catch(function (err) { console.log(''); });
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

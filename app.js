'use strict';

// Dependencies -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
const cheerio = require('cheerio');
const Knwl = require('knwl.js');
const Crawler = require("simplecrawler");

// Configure Knwl -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const knwlInstance = new Knwl('english');
// Register experimental Knwl plugins
knwlInstance.register('internationalPhones', require('./plugins/knwl/internationalPhones.js'));

// Utilities -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const EmailLib = require('./utilities/EmailLib');
const PhoneLib = require('./utilities/PhoneLib');
const PlaceLib = require('./utilities/PlaceLib');
const CompanyLib = require('./utilities/CompanyLib');

// Services -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const CompanyHouseApi = require('./services/CompanyHouseApi');

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
let crawler = new Crawler(domain);
crawler.maxDepth = 2;

// Holds domain relevant information
let domainInfoObj = {
	emails: new Set(),
	phones: new Set(),
	places: new Set(),
	postcodes: new Set(),
	crawled: new Set()
};

let possibleCompanyRegistrationNumbers = new Set();

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
	CompanyLib.extractCompanyRegNumbers(text, possibleCompanyRegistrationNumbers);	

	// Page Titles -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
	const pageTitle = $('title').text();
	if(pageTitle) { domainInfoObj.crawled.add($('title').text()); }
	
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
    	const protocolPattern = /^https?:\/\//i;

    	// if this is an absolute url just return, else concat the 
    	// base name and relative link
    	return protocolPattern.test($(this).attr('href')) 
    		? $(this).attr("href")
    		: domain + $(this).attr("href"); 
        
    }).get();
};

crawler.on("complete", function() {

	console.log('\n\n\n/ Final Scraping -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-\n');
	console.log(domainInfoObj);

	if(possibleCompanyRegistrationNumbers) {

		const companyHouseApi = new CompanyHouseApi(process.env.API_COMPANIES_HOUSE_KEY);

		// fetch company house data for each reg no. found
		possibleCompanyRegistrationNumbers.forEach((number) => {
			companyHouseApi.searchCompany(number, (companyRegistration) => {
				// cross reference collated postcodes with company house data
				if(domainInfoObj.postcodes.has(companyRegistration.registeredAddress.postal_code)) {

					console.log('registration_details:');
					console.log(companyRegistration);

					// using this reg no. try to find the associated officers
					companyHouseApi.searchOfficers(number, (companyOfficers) => {
						companyOfficers.forEach((officer, i) => {
							console.log(`officer_${i + 1}:`);
							console.dir(officer);
						})
					});
				}
			});
		});
	} 
});

// Start the crawling process
crawler.start();
// Try crawling sitemap
crawler.queueURL(domain + '/sitemap');

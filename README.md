# CANDDi Challenge

A Node.js based web-scraper that when given an email address scrapes the corresponding domain to 
aggregate relevant information on the business/site in question 
such as additional email addresses, phone numbers and postal addresses.

![Alt text](https://res.cloudinary.com/dj7k0lade/image/upload/v1532740431/github/canddi-crawl.png "CANDDi Scraper")

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development purposes.

### Installing

Windows/OS X/Linux

```
https://github.com/labriffa/canddi-challenge.git
npm install
```

### Running the Application

The application makes use of the Companies House API and as such requires a valid Companies House API Key to be provided as an environment variable.

```
API_COMPANIES_HOUSE_KEY={API_KEY} node app.js hello@canddi.com
```

## Features
* Uses Companies House to fetch company data based on detected registration numbers
* Uses Companies House to fetch corresponding officers 
* Uses a SIC dataset to fetch SIC descriptions for each returned Company House SIC code
* Crawls domains 2 levels deep
* Attempts to crawl sitemaps

## Todos
* Consider removing duplicated addresses

## Dependencies
* Cheerio
* Knwl.js
* Request-Promise
* SimpleCrawler

## Authors

* **Lewis Alberto Briffa**


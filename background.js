// hello

MSECONDS_REFRESH = 3000; // 3000 millisecs = 3 secs

// Gets all the urls in all tabs of chrome
function getOpenUrls() {
    var urlsFromStorage = new Array();
    if(localStorage.urls)
	urlsFromStorage = JSON.parse(localStorage.urls);
    else
	urlsFromStorage = null;
    chrome.tabs.query({}, function(tabs) {
	if(urlsFromStorage)
	    urls = urlsFromStorage;
	else
	    urls = new Array();
	for(var i = 0; i < tabs.length; i++) {
	    if(urlsFromStorage != null) {
		var urlFromTab = cleanUrl(tabs[i].url);
		var idx = urls.where(urlFromTab);
		if(idx != -1) {
		    urls[idx].totalTime += MSECONDS_REFRESH;
		}
		else {
		    urls.push({
			"name": urlFromTab,
			"totalTime": 0,
			"engagedTime": 0
		    });
		}
	    }
	    else {
		var url = {
		    "name": cleanUrl(tabs[i].url),
		    "totalTime": 0,
		    "engagedTime": 0
		};
		urls.push(url);
	    }
	}
	localStorage.urls = JSON.stringify(urls);
    });
}

// Gets the one active tab in chrome --> Not Syncronous!
function getActiveUrl() {
    // Should be only one tab, but returns an array of tabs
    chrome.tabs.query({"active": true, "lastFocusedWindow": true}, function(tabs) {
	console.log(tabs)
    });
}

// Gets rid of query parameters and http(s) from urls
function cleanUrl(url) {
    url = url.split("://")[1];
    url = url.split("?")[0];
    return url;
}

// Contains function for the array (finds last instance of data)
Array.prototype.where = function(data) {
    var contains = -1;
    for(var i = 0; i < this.length; i++) {
	for(var prop in this[i]) {
	    if(this[i][prop] == data) {
		contains = i;
	    }
	}
    }
    return contains;
}


chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if(request.method == 'getOpenUrls') {
		processUrl(request.url, request.state);
		sendResponse({success: "yeah!"});
    }
    if(request.method == 'sendStats') {
    	sendResponse({urlsTop: sendStats(request.number, request.sortType, request.order)});
    }
});

function repeatUrlFind() {
    getOpenUrls();
    setInterval("repeat()", MSECONDS_REFRESH)
}

function processUrl(url, state) {
    if(localStorage.urls)
	urls = JSON.parse(localStorage.urls);
    else
	urls = new Array();
    var idx = urls.where(cleanUrl(url));
    if(idx != -1) {
	urls[idx].totalTime += MSECONDS_REFRESH;
	if(state == "visible") {
	    urls[idx].engagedTime += MSECONDS_REFRESH;
	}
    }
    else {
	urls.push({
	    "name": cleanUrl(url),
	    "totalTime": 0,
	    "engagedTime": 0
	});
    }
    localStorage.urls = JSON.stringify(urls);
}

function sendStats(number, sortType, order) {
	urls = JSON.parse(localStorage.urls);
	urls = urls.sort(dynamicSort(sortType, order)).slice(0, number);
	for(var i = 0; i < urls.length; i++) {
		urls[i].idleTime = urls[i].totalTime - urls[i].engagedTime;
	}
	return urls;
}

function dynamicSort(property, order) {
	if(order == "descending") {
		return function(a,b) {
			if(a[property] < b[property])
				return 1;
			if(a[property] > b[property])
				return -1;
			return 0;
		}
	}
	return function(a,b) {
		if(a[property] < b[property])
			return -1;
		if(a[property] > b[property])
			return 1;
		return 0;
	}
}


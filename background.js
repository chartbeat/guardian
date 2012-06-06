// hello

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
		processUrl(request.url, request.state, request.msecondsRefresh);
		sendResponse({success: "yeah!"});
    }
    if(request.method == 'sendStats') {
    	sendResponse({urlsTop: sendStats(request.number, request.sortType, request.order)});
    }
});

function processUrl(url, state, msecondsRefresh) {
    if(localStorage.urls) {
		urls = JSON.parse(localStorage.urls);
	}
    else {
		urls = new Array();
	}
    var idx = urls.where(cleanUrl(url));
    if(idx != -1) {
			urls[idx].totalTime += msecondsRefresh;
		if(state == "visible") {
		    urls[idx].engagedTime += msecondsRefresh;
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
	for(var i = 0; i < urls.length; i++) {
		urls[i].idleTime = urls[i].totalTime - urls[i].engagedTime;
	}	
	urls = urls.sort(dynamicSort(sortType, order)).slice(0, number);
	return urls;
}

function dynamicSort(property, order) {
	if(order == "descending") {
		return function(a,b) {
			if(a[property] < b[property])
				return -1;
			if(a[property] > b[property])
				return 1;
			return 0;
		}
	}
	return function(a,b) {
		if(a[property] < b[property])
			return 1;
		if(a[property] > b[property])
			return -1;
		return 0;
	}
}


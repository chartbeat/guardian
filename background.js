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

Array.prototype.query = function(compare, query) {
	var result = new Array();
	for(var i = 0; i < this.length; i++) {
		var match = true;
		if(! compare(this[i][query.key], query.value)) {
			match = false;
		}
		if(match) {
			result.push(this[i]);
		}
	}
	return result;
}

function inHour(a, b) {
	a = new Date(a);
	b = new Date(b);
	if(a.getHours() == b.getHours()) {
		return true;
	}
	return false;
}

// Has to be equal to all fields specified
function equal(a, b) {
	if(a == b) {
		return true;
	}
	return false;
}

// Has to be not equal to all fields specified
function notEqual(a, b) {
	if(a != b) {
		return true;
	}
	return false;
}

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if(request.method == 'getOpenUrls') {
		processUrl(request.data);
		sendResponse({success: "yeah!"});
    }
    if(request.method == 'sendStats') {
    	sendResponse({urlsTop: sendStats(request.number, request.sortType, request.order)});
    }
});

function processUrl(data) {
    if(localStorage.urls) {
		urls = JSON.parse(localStorage.urls);
	}
    else {
		urls = new Array();
	}
    var idx = urls.where(cleanUrl(data.url));
    if(idx != -1) {
		urls[idx].totalTime += data.msecondsRefresh;
		if(data.status.state == "engaged") {
		    urls[idx].engagedTime += data.msecondsRefresh;
		}
		urls[idx].status.push({
			"state": data.status.state,
			"time": data.status.time,
		});
    }
    else {
		urls.push({
		    "name": cleanUrl(data.url),
		    "domain": data.domain,
		    "status": [{
		    	"state": data.status.state,
		    	"time": data.status.time,
		    }],
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
	return urls.sort(dynamicSort(sortType, order)).slice(0, number);
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


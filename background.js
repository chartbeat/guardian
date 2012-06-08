// hello

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if(request.method == 'getOpenUrls') {
		processUrl(request.data);
		sendResponse({success: "yeah!"});
    }
    if(request.method == 'sendUrlStats') {
    	sendResponse({urlsTop: sendUrlStats(request.number, request.sortType, request.order)});
    }
    if(request.method == 'sendHistogramStats') {
    	sendResponse({info: sendHistogramStats(request.type, request.metric, request.start, request.number)});
    }
});

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
	a.setMilliseconds(0);
	b.setMilliseconds(0);
	a.setSeconds(0);
	b.setSeconds(0);
	a.setMinutes(0);
	b.setMinutes(0);
	if(a.getTime() == b.getTime()) {
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

function processUrl(data) {
	localStorage.msecondsRefresh = data.msecondsRefresh;
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
			state: data.status.state,
			time: data.status.time,
		});
    }
    else {
		urls.push({
		    name: cleanUrl(data.url),
		    domain: data.domain,
		    status: [{
		    	state: data.status.state,
		    	time: data.status.time,
		    }],
		    totalTime: 0,
		    engagedTime: 0
		});
    }
    localStorage.urls = JSON.stringify(urls);
}

function sendUrlStats(number, sortType, order) {
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

function createAxisTitle(axis, type, metric) {
	var title =  "";
	if(axis == "y") {
		if(metric == "totalEngagedTime") {
			title += "Engaged Time ";
		}
		else if(metric == "somethingElse") {
			title += "That thing ";
		}
		if(type == "hour") {
			title += "(min)";
		}
		else if(type == "day") {
			title += "(hr)";
		}
		else if(type == "week") {
			title += "(day)"
		}
		else if(type == "month") {
			title += "(week)";
		}
	}
	else if(axis == "x") {
		if(metric == "totalEngagedTime") {
			title += type.charAt(0).toUpperCase() + type.slice(1);
		}
		else if(metric == "someThingElse") {
			title += "That thing";
		}
	}
	return title;
}

function sendHistogramStats(type, metric, start, number) {
	var msecondsRefresh = localStorage.msecondsRefresh;
	var urls = JSON.parse(localStorage.urls);
	var data = new Array()
	start = new Date(start); // start comes as JSON string
	start.setMinutes(0);
	start.setSeconds(0);
	start.setMilliseconds(0);
	yTitle = createAxisTitle("y", type, metric);
	xTitle = createAxisTitle("x", type, metric);
	if(type == "hour" && metric == "totalEngagedTime") {
		for(var i = 0; i < number; i++) {
			var count = 0;
			start.addHours(1);
			for(var j = 0; j < urls.length; j++) {
				count += urls[j].status
								.query(inHour, {key:"time", value:(start)})
								.query(equal, {key:"state", value:"engaged"}).length;
			}
			// start = label, count... = msecs
			data.push({
				time: new Date(start),
				msecs: count * msecondsRefresh,
			});
		}
	}
	if(type == "day" && metric == "totalEngagedTime") {
		var startDate = start.getDate();
	}
	return {
		yTitle: yTitle,
		xTitle: xTitle,
		data: data,
	};
}

Date.prototype.addHours = function(h) {
	// if(this.getHours() >= 24 - h) {
	// 	this.setDate(this.getDate()+1);
	// }
    this.setHours(this.getHours()+h);
    return this;
}

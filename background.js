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
        sendResponse({info: sendHistogramStats(request.type, request.metric, request.start, request.end)});
    }
    if(request.method == 'loadFakeData') {
	loadFakeData();
        sendResponse({success: "yeah!"});
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

function inDay(a, b) {
    a = new Date(a);
    b = new Date(b);
    a.setMilliseconds(0);
    b.setMilliseconds(0);
    a.setSeconds(0);
    b.setSeconds(0);
    a.setMinutes(0);
    b.setMinutes(0);
    a.setHours(0);
    b.setHours(0);
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

//This is such shit --> what happens when I'm being super lazy
function sendHistogramStats(type, metric, start, end) {
    var msecondsRefresh = Number(localStorage.msecondsRefresh);
    var urls = JSON.parse(localStorage.urls);
    var data = new Array();
    start = new Date(start); // start comes as JSON string
    start.setMinutes(0);
    start.setSeconds(0);
    start.setMilliseconds(0);
    end = new Date(end);
    end.setMinutes(0);
    end.setSeconds(0);
    end.setMilliseconds(0);
    yTitle = createAxisTitle("y", type, metric);
    xTitle = createAxisTitle("x", type, metric);
    if(metric == "totalEngagedTime") {
        while(start - end <= 0){
            var count = 0;
            var domains = new Array();
            for(var j = 0; j < urls.length; j++) {
                if(type == "hour") {
                    res = urls[j].status
                                .query(inHour, {key:"time", value:(start)})
                                .query(equal, {key:"state", value:"engaged"});
                    count += res.length;
                    if(res.length > 0) {
                        var idx = domains.where(urls[j].domain);
                        if(idx != -1) {
                            domains[idx].msecs += res.length * msecondsRefresh;
                        }
                        else {
                            domains.push({
                                name: urls[j].domain,
                                msecs: res.length * msecondsRefresh,
                            });
                        }
                    }
                }
                else if(type == "day") {
                    res = urls[j].status
                                .query(inDay, {key:"time", value:(start)})
                                .query(equal, {key:"state", value:"engaged"});
                    count += res.length;
                    if(res.length > 0) {
                        var idx = domains.where(urls[j].domain);
                        if(idx != -1) {
                            domains[idx].msecs += res.length * msecondsRefresh;
                        }
                        else {
                            domains.push({
                                name: urls[j].domain,
                                msecs: res.length * msecondsRefresh,
                            });
                        }
                    }
                }
            }
            domains.sort(function(a,b) {return -(a.msecs-b.msecs);});
            data.push({
                time: new Date(start),
                msecs: count * msecondsRefresh,
                domains: domains,
            });
            if(type == "hour") {
                start.addHours(1);
            }
            else if(type == "day") {
                start.addDays(1);
            }           
        }
    }
    // else if(metric == "domainsEngagedTime") {
    //     for(var i = 0; i < number; i++) {
    //         var count = 0;
    //         if(type == "hour") {
    //             start.addHours(1);
    //         }
    //         else if(type == "day") {
    //             start.addDays(1);
    //         }
    //         for(var j = 0; j < urls.length; j++) {
    //             if(type == "hour") {
    //                 count += urls[j].status
    //                                 .query(inHour, {key:"time", value:(start)})
    //                                 .query(equal, {key:"state", value:"engaged"}).length;
    //             }
    //             else if(type == "day") {
    //                 count += urls[j].status
    //                                 .query(inDay, {key:"time", value:(start)})
    //                                 .query(equal, {key:"state", value:"engaged"}).length;                   
    //             }
    //             var idx = data.where(urls[j].domain);
    //             if(idx != -1) {
    //                 data[idx].msecs += (count * msecondsRefresh);
    //             }
    //             else {
    //                 data.push({
    //                     domain: urls[j].domain,
    //                     msecs: count * msecondsRefresh,
    //                 });
    //             }       
    //         }
    //     }       
    // }
    // console.log(data);
    return {
        yTitle: yTitle,
        xTitle: xTitle,
        data: data,
    };
}

function loadFakeData() {
    // console.log(JSON.parse(fakeDataLoad()));
    // localStorage.urlsOld = localStorage.urls;
    localStorage.urls = fakeDataLoad();
}

Date.prototype.addHours = function(h) {
    this.setHours(this.getHours()+h);
    return this;
}

Date.prototype.addDays = function(d) {
    this.setDate(this.getDate()+d);
    return this;
}


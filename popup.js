NUMBER_TOP = 10;
SORT_TYPE = "engagedTime";
SORT_ORDER = "descending";

// chrome.extension.sendRequest({
//     method: 'sendStats',
//     number: NUMBER_TOP,
//     sortType: SORT_TYPE,
//     order: SORT_ORDER,
// }, function(response){
//     urlsTop = response.urlsTop;
//     for(var i = 0; i < urlsTop.length; i++) {
//         el = $(document.createElement('ul')).addClass('row');
//         siteName = $(document.createElement('li')).addClass('siteName').text(urlsTop[i].name);
//         engagedTime = $(document.createElement('li')).addClass('engagedTime').text(humanizeTime(urlsTop[i].engagedTime));
//         idleTime = $(document.createElement('li')).addClass('idleTime').text(humanizeTime(urlsTop[i].idleTime));
//         $(el).append(siteName, engagedTime, idleTime);
//         $('div.table').append(el);
//     }
// });

updateOrder(SORT_TYPE, SORT_ORDER);



function humanizeTime(millisecs) {
    time = (((millisecs / 1000) / 60) / 60); // time in hrs
    return time.toFixed(1) + " hrs"
}

function updateOrder(sortType, order) {
    chrome.extension.sendRequest({
        method: 'sendStats',
        number: NUMBER_TOP,
        sortType: sortType,
        order: order,
    }, function(response){
        $('ul.row').remove();
        urlsTop = response.urlsTop;
        for(var i = 0; i < urlsTop.length; i++) {
            el = $(document.createElement('ul'));
            siteName = $(document.createElement('li')).addClass('siteName').text(urlsTop[i].name);
            engagedTime = $(document.createElement('li')).addClass('engagedTime').text(humanizeTime(urlsTop[i].engagedTime));
            idleTime = $(document.createElement('li')).addClass('idleTime').text(humanizeTime(urlsTop[i].idleTime));
            $(el).append(siteName, engagedTime, idleTime);
            $('div.table').append(el);
        }
    });
}
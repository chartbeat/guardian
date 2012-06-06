NUMBER_TOP = 10;
SORT_TYPE = "engagedTime";
SORT_ORDER = "ascending"; // complete hack to get the order to be in the right direction on the load

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
            el = $(document.createElement('ul')).addClass('row');
            // took out classes, which were "engagedTime, idleTime" not sure if were necessary
            siteName = $(document.createElement('li')).addClass('site').text(urlsTop[i].name);
            engagedTime = $(document.createElement('li')).text(humanizeTime(urlsTop[i].engagedTime));
            idleTime = $(document.createElement('li')).text(humanizeTime(urlsTop[i].idleTime));
            $(el).append(siteName, engagedTime, idleTime);
            $('div.table').append(el);
        }
    });
}

function toggle(sortType, currentOrder) {
    if(currentOrder == "ascending") {
        currentOrder = "descending";
    }
    else {
        currentOrder = "ascending";
    }
    updateOrder(sortType, currentOrder);
}

jQuery(function($) {
    $('ul#headerRow li').click(function() {
        if($(this).children("span").children(".down").length && ! $(this).children("span").children(".up").length) {
            order = "ascending";
            $(this).children("span").children(".down").remove();
            el = $(document.createElement('img')).addClass('up').attr('src', 'img/triangleUp.png');
            $(this).children("span").append(el);
            fixOtherArrows($(this), $('ul#headerRow li').not($(this)));
        }
        else {
            order = "descending";
            $(this).children("span").children(".up").remove();
            el = $(document.createElement('img')).addClass('down').attr('src', 'img/triangleDown.png');
            $(this).children("span").append(el);
            fixOtherArrows($(this), $('ul#headerRow li').not($(this)));                  
        }
        toggle($(this).attr('id'), order);
    });
});

function fixOtherArrows(clicked, others) {
    for(var i = 0; i < others.length; i++) {
        $(others[i]).children("span").children().remove();
        up = $(document.createElement('img')).addClass('up').attr('src', 'img/triangleUp.png');
        down = $(document.createElement('img')).addClass('down').attr('src', 'img/triangleDown.png');
        $(others[i]).children("span").append(up, down);
    }
}
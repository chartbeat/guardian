// Currently there is a bug that when you leave the application the state of the app is not saved!


NUMBER_TOP = 10;
SORT_TYPE = "engagedTime";
SORT_ORDER = "ascending"; // complete hack to get the order to be in the right direction on the load


updateOrder(SORT_TYPE, SORT_ORDER, NUMBER_TOP);

function humanizeTime(millisecs) {
    time = ((millisecs / 1000) / 60); // time in min
    return time.toFixed(1) + " mins"
}

function updateOrder(sortType, order, number) {
    sessionStorage.sortType = sortType;
    sessionStorage.order = order;
    sessionStorage.numberTop = number;
    chrome.extension.sendRequest({
        method: 'sendUrlStats',
        number: number,
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
            $('div.urls').append(el);
        }
        $('div.urls').append($(document.createElement('p')).addClass('clear'));
    });
}

function updateNumberTop(numberTop) {
    updateOrder(sessionStorage.sortType, sessionStorage.order, numberTop);
}

function toggle(sortType, currentOrder) {
    if(currentOrder == "ascending") {
        currentOrder = "descending";
    }
    else {
        currentOrder = "ascending";
    }
    updateOrder(sortType, currentOrder, Number(sessionStorage.numberTop));
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

    $('form#settings').submit(function() {
        numberTop = $('input[name="numberOfUrls"]').val();
        if(numberTop == 'all') {
            numberTop = 10000; // hack
        }
        else {
            numberTop = Number($('input[name="numberOfUrls"]').val());
        }
        updateNumberTop(numberTop);
        return false;
    });

    $('ul.navBar li').click(function() {
        $(this).attr('id', 'selected');
        $('ul.navBar li').not($(this)).removeAttr('id').each(function(index, value) {
            className = 'div.' + $(value).attr('class');
            $(className).hide();
        });
        className = 'div.' + $(this).attr('class');
        $(className).show();
    });

    $(document).ready(function() {
        // hack to get the domains tab
        paintHistogram($('div.domains')[0], 450, 300);

        $('ul.navBar li').not($('ul.navBar li#selected')).each(function(index, value) {
            className = 'div.' + $(value).attr('class');
            $(className).hide();
        });
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

function paintHistogram(element, width, height) {
    // hard coded just to make sure is working!
    start = new Date();
    start.setHours(9);
    start.setDate(7);
    chrome.extension.sendRequest({
        method: 'sendHistogramStats',
        type: "hour",
        metric: "totalEngagedTime",
        start: start,
        number: 48,
    }, function(response) {
        console.log(response.info.xTitle);
        console.log(response.info.yTitle);
        console.log(response);
        var data = response.info.data;
        var arr = new Array();
        for(var i = 0; i < data.length; i++) {
            var min = ((data[i].msecs / 1000) / 60);
            arr.push([new Date(data[i].time).getTime(), min]);
        }
        var chart1 = new Highcharts.Chart({
            chart: {
                renderTo: 'domainsChart',
                type: 'column',
                zoomType: 'x',
            },
            title: {
                text: 'Domains'
            },
            xAxis: {
                type: 'datetime'
            },
            yAxis: {
                title: {
                    text: 'Engaged Time (min)'
                }
            },
            legend: {
                enabled: false
            },
            series: [{
                data: arr
            }]
        });
    });
}

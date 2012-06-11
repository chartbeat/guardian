// Currently there is a bug that when you leave the application the state of the app is not saved!


NUMBER_TOP = 10;
SORT_TYPE = "engagedTime";
SORT_ORDER = "ascending"; // complete hack to get the order to be in the right direction on the load

var chart;

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

    $('div.urls form#settings').submit(function() {
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
    
    $('div.domains select#measure').change(function() {
        var measure = $('select#measure option:selected').val();
        paintHistogram('domainsChart', measure, 'totalEngagedTime', start, 7);
    });

    $(document).ready(function() {
        // hack to get the domains tab
        start = new Date();
        start.setHours(13);
        start.setDate(10);
        paintHistogram('domainsChart', 'hour', 'totalEngagedTime', start, 7);

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

// bug with any incrament > 1
function paintHistogram(elementId, type, metric, start, incraments) {
    // hard coded just to make sure is working!
    chrome.extension.sendRequest({
        method: 'sendHistogramStats',
        type: type,
        metric: metric,
        start: start,
        number: incraments,
    }, function(response) {
        var rData = response.info.data;
        // console.log(data);
        var colors = Highcharts.getOptions().colors;
        var data = new Array();
        for(var i = 0; i < rData.length; i++) {
            var categories = new Array();
            var subArr = new Array();
            for(var j = 0; j < rData[i].domains.length; j++) {
                var subMin = ((rData[i].domains[j].msecs / 1000) / 60);
                if(subMin > 0) {
                    categories.push(rData[i].domains[j].name);
                    subArr.push(subMin);
                }
            }
            var min = ((rData[i].msecs / 1000) / 60);
            if(metric == 'totalEngagedTime') {
                data.push({
                    x: new Date(rData[i].time).getTime(),
                    y: min,
                    drilldown: {
                        name: 'domains',
                        categories: categories,
                        data: subArr,
                        color: colors[1],
                    },
                });
            }
            else if(metric == 'domainsEngagedTime') {
                categories.push(rData[i].domain);
                data.push(min);
            }
        }
        var xAxis;
        if(metric == 'domainsEngagedTime') {
            xAxis = {
                categories: categories,
                labels: {
                    rotation: -45,
                    align: 'right',
                },
            };
        }
        else if(metric == 'totalEngagedTime') {
            xAxis = {
                type: 'datetime',
                labels: {
                    rotation: -45,
                    align: 'right',
                },
            };
        }
        function setChart(name, categories, data, color) {
            chart.series[0].remove();
            chart.xAxis[0].setCategories(categories);
            // console.log(data);
            chart.addSeries({
                name: name,
                data: data,
                color: color || colors[0],
            });
        }
        
        var chart;
        chart = new Highcharts.Chart({
            chart: {
                renderTo: elementId,
                zoomType: 'x',
                type: 'column'
            },
            title: {
                text: 'Engagement'
            },
            subtitle: {
                text: 'Click the columns to view domains. Click again to view total engagement.'
            },
            xAxis: xAxis,
            yAxis: {
                title: {
                    text: 'Engaged Time (min)'
                }
            },
            plotOptions: {
                column: {
                    cursor: 'pointer',
                    point: {
                        events: {
                            click: function() {
                                var drilldown = this.drilldown;
                                if (drilldown) { // drill down
                                    setChart(drilldown.name, drilldown.categories, drilldown.data, drilldown.color);
                                } else { // restore
                                    chart.options.xAxis.type = 'datetime';
                                    categories = undefined;
                                    setChart(name, categories, data);
                                }
                            }
                        }
                    },
                    // dataLabels: {
                    //     enabled: true,
                    //     // color: colors[0],
                    //     style: {
                    //         fontWeight: 'bold'
                    //     },
                    //     formatter: function() {
                    //         return this.y +'%';
                    //     }
                    // }
                }
            },
            tooltip: {
                formatter: function() {
                    var point = this.point,
                        s = this.x +':<b>'+ this.y +' minutes engaged</b><br/>';
                    if (point.drilldown) {
                        s += 'Click to view '+ point.category +' domains';
                    } else {
                        s += 'Click to return to total engagement';
                    }
                    return s;
                }
            },
            series: [{
                name: name,
                data: data,
                // color: 'white'
            }],
            exporting: {
                enabled: false
            },
            legend: {
                enabled: false
            },
        });
    });
}

// function setChart(name, categories, data, color) {
//     console.log(categories);
//     chart.xAxis.
//     chart.xAxis[0].setCategories(categories);
//     chart.series[0].remove();
//     chart.addSeries({
//         name: name,
//         data: data,
//         color: color || '#fff'
//     });
// }


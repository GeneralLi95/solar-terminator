var width = 960,
    height = 500;
//
// var map = new L.Map("map", {
//     center: [37.8, -96.9],
//     zoom: 1,
//     minZoom: 1,
//     maxBounds: [[-90,-360], [90,360]]
// })
//     .addLayer(new L.TileLayer("http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png"));

var map = new L.Map("map", {
    center: [37.8, -96.9],
    zoom: 2,
    minZoom: 1,
    maxZoom: 18,
    maxBounds: [[-90,-360], [90,360]]
});

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: 'A test map for <a href="http://www.higis.org.cn">HiGIS</a> contributors, ' +
    '<a href="http://www.nudt.edu.cn">DBGISRG</a>',
    id: 'mapbox.streets'
}).addTo(map);


// L.tileLayer('http://t1.tianditu.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}', {        //天地图
//     attribution: 'A test map for <a href="http://www.higis.org.cn">HiGIS</a> contributors, ' +
//     '<a href="http://www.nudt.edu.cn">DBGISRG</a>',
//     id: 'mapbox.streets'
// }).addTo(map);

var svg = d3.select(map.getPanes().overlayPane).append("svg"),  //svg可缩放矢量图形
    g = svg.append("g").attr("class", "leaflet-zoom-hide");

var path = d3.geo.path().projection(project);

var pi, radians, degrees;
pi = Math.PI;
radians = pi / 180;
degrees = 180 / pi;

var circle = d3.geo.circle()
    .angle(90);

var λ = d3.scale.linear()
    .domain([0, width])
    .range([-180, 180]);

var φ = d3.scale.linear()
    .domain([0, height])
    .range([90, -90]);

var night1 = g.append("path")
    .attr("class", "night1")
    .attr("d", function(d) {
        var newPath = processPath(path(d));
        return newPath;
    });

var night2 = g.append("path")     //以国际日期分界线（东经180度）为界，区分一下日期，
    .attr("class", "night1")
    .attr("d", function(d) {
        var newPath = processPath(path(d));
        return newPath;
    });

var night3 = g.append("path")
    .attr("class", "night1")
    .attr("d", function(d) {
        var newPath = processPath(path(d));
        return newPath;
    });

// var night1 = g.append("path")
//     .attr("fill", "none")
//     .attr("stroke", "black")
//     .attr("stroke-width", "2")
//     .attr("d", function(d) {
//       var newPath = processPath(path(d));
//       return newPath;
//     });

map.on("zoomend", function() {
    reset();
});

map.on("moveend", function() {
    reset();
});
reset();
// Reposition the SVG to cover the features.  SVG重定位
function reset() {

    var bounds = map.getBounds();

    var bottomLeft = project([bounds.getWest(), bounds.getSouth()]),
        topRight = project([bounds.getEast(), bounds.getNorth()]);
    // console.log(bottomLeft, topRight);
    svg .attr("width", topRight[0] - bottomLeft[0])
        .attr("height", bottomLeft[1] - topRight[1])
        .style("margin-left", bottomLeft[0] + "px")
        .style("margin-top", topRight[1] + "px");

    var pathWidth = project([180, -90])[0] - project([-180, -90])[0];
    //console.log(pathWidth);

    night1.attr("transform", "translate(" + -bottomLeft[0] + "," + -topRight[1] + ")");
    night2.attr("transform", "translate(" + (-bottomLeft[0] - pathWidth) + "," + -topRight[1] + ")");
    night3.attr("transform", "translate(" + (-bottomLeft[0] + pathWidth) + "," + -topRight[1] + ")");

    g.selectAll("path").attr("d", function(d) {
        var newPath = processPath(path(d));
        return newPath;
    });
}

function processPath(pathString) {
    if (pathString != null) {
        var pathStringStripped = pathString.replace("M", "");
        pathStringStripped = pathStringStripped.replace("Z", "");
        var coords = pathStringStripped.split("L");
        var currentCoord, nextCoord, newCoords = [];
        for (var i = coords.length - 1; i > 0; i--) {
            currentCoord = coords[i].split(",");
            currentCoord[0] = parseInt(currentCoord[0], 10);
            currentCoord[1] = parseInt(currentCoord[1], 10);
            nextCoord = coords[i - 1].split(",");
            nextCoord[0] = parseInt(nextCoord[0], 10);
            nextCoord[1] = parseInt(nextCoord[1], 10);
            newCoords.push(currentCoord);
        }
        newCoords = newCoords.sort(sortFunc);
        var newPathString = ["M"];
        for (var i = newCoords.length - 1; i >= 0; i--) {
            // if (i === 0) {
            //   newPathString.push(newCoords[i].join(","));
            // }
            // else {
            newPathString.push(newCoords[i].join(",") + "L");
            // }
        }
        // var endPointLatLng = map.layerPointToLatLng(newCoords[0]);

        //针对源代码的错误，在此增加一个判断，
        // 以太阳直射点纬度值得正负来判定处于夏还是冬、不同时间对应的project函数范围不一样
        // solarPosition 太阳位置是一个时间的函数，指该时间太阳在地球直射点的位置，
        // 夏季位于北半球纬度为正，冬季位于南半球，纬度为负
        var aaa = solarPosition(myDate)[1];
        //console.log(aaa);
        if (aaa < 0) {
            var projectedWest = project([90, 180]);
            var projectedEast = project([90, 180]);

        }
        else {
            var projectedWest = project([-180, -90]);
            var projectedEast = project([-180, -90]);
        }

        newPathString.push([newCoords[0][0], projectedWest[1]].join(",") + "L");
        newPathString.push([newCoords[newCoords.length - 1][0], projectedEast[1]].join(",") + "Z");
        newPathString = newPathString.join("");
    }
    return newPathString;

    function sortFunc(a,b) {
        return a[0] - b[0];
    }
}

// Use Leaflet to implement a D3 geographic projection.
function project(x) {
    var point = map.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
    //map.latLngToLayerPoint  leaflet API 给定地理坐标，返回相对于原点像素的相应像素坐标。
    return [point.x, point.y];
}

//setInterval(redraw, 100); //设置重绘间隔时间

function redraw() {//--------重绘函数-------注意该函数在jQury模块中的调用位置-------------
    // console.log(antipode(solarPosition(new Date())));

    //自定义时间代码
    var getdateStr = $("#datePicker").val();
    var hour = $("#cuztime").val();
    var temp = getdateStr+" "+hour;
    a = Date.parse(temp);
    myDate = new Date(a);

    var solarPoint = antipode(solarPosition(myDate));
    var collection = circle.origin(antipode(solarPosition(myDate)));
    //自定义时间代码结束

    //自动获取时间代码
    //var solarPoint = antipode(solarPosition(new Date()));
    //var collection = circle.origin(antipode(solarPosition(new Date())));
    //自动获取时间代码结束

    // var collection = circle.origin(solarPosition(new Date()));
    // console.log(collection);
    night1.datum(collection).attr("d", function(d) {
        var newPath = processPath(path(d));
        //var newPath = (path(d));
        night2.datum(collection).attr("d", newPath);
        night3.datum(collection).attr("d", newPath);
        return newPath;
    });
}

function antipode(position) {//
    return [position[0] + 180, -position[1]];
}

function solarPosition(time) { //太阳直射点位置  春分到秋分之间 纬度大于零，秋分到春分之间纬度小于零
    var centuries = (time - Date.UTC(2000, 0, 1, 12)) / 864e5 / 36525, // since J2000
        longitude = (d3.time.day.utc.floor(time) - time) / 864e5 * 360 - 180;
    var terminatorArr = [
        longitude - equationOfTime(centuries) * degrees,
        solarDeclination(centuries) * degrees
    ];

    return terminatorArr;
}

// Equations based on NOAA’s Solar Calculator; all angles in radians.
// 公式建立在NOAA（美国国家海洋和大气管理局） 太阳计算器基础上，全部采用弧度制
// http://www.esrl.noaa.gov/gmd/grad/solcalc/

function equationOfTime(centuries) { //时间计算公式
    var e = eccentricityEarthOrbit(centuries),
        m = solarGeometricMeanAnomaly(centuries),
        l = solarGeometricMeanLongitude(centuries),
        y = Math.tan(obliquityCorrection(centuries) / 2);
        y *= y;
    return y * Math.sin(2 * l)
        - 2 * e * Math.sin(m)
        + 4 * e * y * Math.sin(m) * Math.cos(2 * l)
        - 0.5 * y * y * Math.sin(4 * l)
        - 1.25 * e * e * Math.sin(2 * m);
}

function solarDeclination(centuries) {//太阳赤纬
    return Math.asin(Math.sin(obliquityCorrection(centuries)) * Math.sin(solarApparentLongitude(centuries)));
}

function solarApparentLongitude(centuries) {//太阳表现经度
    return solarTrueLongitude(centuries) - (0.00569 + 0.00478 * Math.sin((125.04 - 1934.136 * centuries) * radians)) * radians;
}

function solarTrueLongitude(centuries) {//太阳真实经度
    return solarGeometricMeanLongitude(centuries) + solarEquationOfCenter(centuries);
}

function solarGeometricMeanAnomaly(centuries) {//太阳几何平均异常？
    return (357.52911 + centuries * (35999.05029 - 0.0001537 * centuries)) * radians;
}

function solarGeometricMeanLongitude(centuries) { //太阳几何平均经度
    var l = (280.46646 + centuries * (36000.76983 + centuries * 0.0003032)) % 360;
    return (l < 0 ? l + 360 : l) / 180 * pi;
}

function solarEquationOfCenter(centuries) { //太阳中心公式
    var m = solarGeometricMeanAnomaly(centuries);
    return (Math.sin(m) * (1.914602 - centuries * (0.004817 + 0.000014 * centuries))
        + Math.sin(m + m) * (0.019993 - 0.000101 * centuries)
        + Math.sin(m + m + m) * 0.000289) * radians;
}

function obliquityCorrection(centuries) {   //倾斜矫正
    return meanObliquityOfEcliptic(centuries) + 0.00256 * Math.cos((125.04 - 1934.136 * centuries) * radians) * radians;
}

function meanObliquityOfEcliptic(centuries) { //平均黄道倾角
    return (23 + (26 + (21.448 - centuries * (46.8150 + centuries * (0.00059 - centuries * 0.001813))) / 60) / 60) * radians;
}

function eccentricityEarthOrbit(centuries) {  //eccentricity Earth Orbit 偏心地球轨道
    return 0.016708634 - centuries * (0.000042037 + 0.0000001267 * centuries);
}


//jQuery模块----设置页面交互(增加时间日期框，时间条选择框)-----------
$(function () {
    var now = new Date();    //获取当前时间，初始化的时候采用当前时间
    var today = now.toLocaleDateString();
    var ss = now.getHours()*60 + now.getMinutes();
    // 设置时间条
    $('#Time').slider({
        min: 0,
        max: 1439,  //0到1439  1440个数 24*60
        orientation: "horizontal",
        range: "min",
        value: ss,
    });
    timeValue = $("#Time").slider("value");
    var minutes = (timeValue % 60);
    if (minutes == 0) {
        minutes = '00';
    }
     time = parseInt(timeValue / 60) + ':' + (minutes);

    $("#cuztime").val(time);

    //时间选择控件
    $("#datePicker").datepicker({
        changeMonth: true,
        changeYear: true,
        dateFormat: 'yy/mm/dd',
        defaultDate: today,
    });
    //显示格式化后的默认时间
    $("#datePicker").val(today);


//  $("#datePicker").datepicker("option","maxDate", '02/07/2008');
//  $("#datePicker").datepicker("option","minDate", '02/03/2008');

    $("#datePicker").datepicker("option", "dateFormat", "yy-mm-dd");

    $("#Time").bind('slide', function () {
        if (stop !== 'undefined') {
            clearInterval(stop);
            // $scope.play = false;
        }
        timeValue = $("#Time").slider("value");
        var minutes = (timeValue % 60);
        if (minutes < 10) {
            minutes = '0'+ minutes;  //确保分位显示两位有效数字
        }
        time = parseInt(timeValue / 60) + ':' + (minutes);
       // time = parseInt(timeValue / 60);
        $("#cuztime").val(time );

        var elem = $("#showTime");
        var left = $(".ui-slider-handle").offset().left - 10;
        elem.css({left: left + "px"});
        redraw();        //

    });

// 并绑定showTime位置
    $("#Time").bind('slidestop', function () {
        timeValue = $("#Time").slider("value");
        var minutes = (timeValue % 60);
        if (minutes < 10) {
            minutes = '0' + minutes;
        }
         time = parseInt(timeValue / 60) + ':' + (minutes);
        //time = parseInt(timeValue / 60);
        // $scope.play = false;
        $("#cuztime").val(time);

        var elem = $("#showTime");

        var left = $(".ui-slider-handle").offset().left - 10;
        elem.css({left: left + "px"});
        if ($("#datePicker").val() != '') {
            redraw();
        }
    });

    map.on("viewreset", redraw);
    redraw();

});

//绑定滑动事件——“showTime”位置和值

var play = false;
var curDate = '';
$('#datePicker').change(function () {
    // if (stop !== 'undefined') {
    //     clearInterval(stop);
    // }
    play = false;
    // getVolOneDay();
    if ($("#datePicker").val() !== ''
    // && $("#cuztime").val() !== ''
    )
    curDate = $("#datePicker").val();
});


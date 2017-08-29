'use strict';

$(document).foundation();

// To achieve full height section
function set_full_height(section) {
    var window_width = jQuery(window).width();
    var window_height = jQuery(window).height();
    var filter_height = jQuery(".filter").height();

    var full_height = window_height - 155; // remove header height

    var minimum_height = 480;

    // ad touch shim for iOS
    if (jQuery('html').hasClass('touch')) {
        var mobile_shim = 0;
        full_height -= mobile_shim;
        minimum_height -= mobile_shim;
    }

    if (full_height < minimum_height) {
        full_height = minimum_height;
    }

    jQuery(section).height(full_height);
}

jQuery.fn.scrollTo = function (elem, speed) {
    $(this).animate({
        scrollTop: $(this).scrollTop() - $(this).offset().top + $(elem).offset().top
    }, speed == undefined ? 1000 : speed);
    return this;
};

function paddedBounds(npad, spad, epad, wpad) {
    var SW = map.getBounds().getSouthWest();
    var NE = map.getBounds().getNorthEast();
    var topRight = map.getProjection().fromLatLngToPoint(NE);
    var bottomLeft = map.getProjection().fromLatLngToPoint(SW);
    var scale = Math.pow(2, map.getZoom());

    var SWtopoint = map.getProjection().fromLatLngToPoint(SW);
    var SWpoint = new google.maps.Point((SWtopoint.x - bottomLeft.x) * scale + wpad, (SWtopoint.y - topRight.y) * scale - spad);
    var SWworld = new google.maps.Point(SWpoint.x / scale + bottomLeft.x, SWpoint.y / scale + topRight.y);
    var pt1 = map.getProjection().fromPointToLatLng(SWworld);

    var NEtopoint = map.getProjection().fromLatLngToPoint(NE);
    var NEpoint = new google.maps.Point((NEtopoint.x - bottomLeft.x) * scale - epad, (NEtopoint.y - topRight.y) * scale + npad);
    var NEworld = new google.maps.Point(NEpoint.x / scale + bottomLeft.x, NEpoint.y / scale + topRight.y);
    var pt2 = map.getProjection().fromPointToLatLng(NEworld);

    return new google.maps.LatLngBounds(pt1, pt2);
}

var map;
var infoWindow;
var markers = [];
var items = [];
var data = "";

var promise = $.getJSON('http://dev-crombie.pantheonsite.io/properties/search');

promise.done(function (datatest) {
    //   datanew = JSON.parse(data);
    //   datanew = datatest;
    items = datatest;
    console.log(items);
    initMap();
});

var panel = $("#markerlist");
var maphtml = $("#map");
var prop_container = $("#properties_container");
var titleText;
panel.innerHTML = '';

var item = document.createElement('DIV');
var title = document.createElement('A');

function initMap() {
    // console.log(datanew);
    // var latlng = new google.maps.LatLng(39.91, 116.38);
    var latlng = new google.maps.LatLng(58.186561, -101.439330); // More related to Canada on Map
    var options = {
        // 'zoom': 2,
        'zoom': 4,
        'center': latlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map'), options);

    // Show markers initate
    showmarkers();

    // var tmpMarkers = [];


    // Bounds changed event on map
    google.maps.event.addListener(map, 'bounds_changed', function (event) {
        prop_container.find('.properties_data').removeClass("active");
        prop_container.find(".loading_list").addClass("active");
    });

    // var bounds = new google.maps.LatLngBounds();

    var position = '';
    // Idle event on map
    google.maps.event.addListener(map, 'idle', function (event) {
        var bounds = paddedBounds(120, 120, 50, 50); // paddedBounds(north,south,east,west);
        clearMarkers();
        var tmpPadMarkers = [];
        // console.info("Normal");
        // console.log(bounds);
        // console.info("With padding");
        // console.log(bounds_padd);
        // console.info("Map.getBounds");
        // console.log(map.getBounds());

        console.log("Idle event");
        k = 0;
        for (var i = 0; i < markers.length; i++) {
            // console.log(map.getBounds());
            if (bounds.contains(markers[i].getPosition())) {
                // markers[i] in visible bounds
                // console.log("marker id -> "+markers[i].get('id')+"------ latitude -> "+markers[i].position.lat()+"-------- Longitude -> "+markers[i].position.lat());
                // position = new google.maps.LatLng(markers[i].latitude, markers[i].longitude);
                tmpPadMarkers.push(markers[i]);
                markers[i].setVisible(true);
                $("#markerlist > div").hide();
                $("#markerlist").find("div#" + markers[i].get('id')).addClass("visible").css("display", "block");
                // console.log(markers.length);
                k++;
            } else {
                // markers[i] is not in visible bounds
                markers[i].setVisible(false);
                $("#markerlist").find("div#" + markers[i].get('id')).removeClass("visible").css("display", "none");
            }
        }
        markercluster(map, tmpPadMarkers);
        setTimeout(function () {
            if (k != markers.length) {
                // Not seeing all Markers so side panel comes out
                maphtml.removeClass("large-12").addClass("large-10");
                prop_container.addClass("active");
                prop_container.find('.properties_data').addClass("active");
                prop_container.find(".loading_list").removeClass("active");
            } else {
                // Seeing all markers on Map so side panel goes away
                maphtml.removeClass("large-10").addClass("large-12");
                prop_container.removeClass("active").find('.properties_data').removeClass("active");
                prop_container.find(".loading_list").removeClass("active");
            }
            // maphtml.css("width","75%");
            prop_container.find(".heading").html("<p>" + k + " PROPERTIES</p>");
            prop_container.find(".redosearch").addClass("visible");
        }, 300);
        // console.log("map zoomed in or zoomed out or moved or changed");
    });
}

function showmarkers() {

    // Create an array of alphabetical characters used to label the markers.
    // var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Add some markers to the map.
    // Note: The code uses the JavaScript Array.prototype.map() method to
    // create an array of markers based on a given "locations" array.
    // The map() method here has nothing to do with the Google Maps API.
    markers = items.map(function (item, i) {
        var mylatlng = { lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) };
        // console.log(mylatlng);
        var marker = new google.maps.Marker({
            position: mylatlng
        });

        marker.set("id", item.property_id);

        marker.addListener('click', function () {
            markerclick(item, mylatlng, marker);
        });

        titleText = item.property_name;

        title.href = '#';
        title.className = 'title';
        title.innerHTML = titleText;

        if (titleText === '') {
            titleText = 'No title';
        }
        panel.append("<div id='" + item.property_id + "' class='marker_item' data-href='" + item.url + "'><div class='marker_image'><img src='" + item.image + "' alt='' /></div><div class='marker_details'><span class='marker_title'><a id='item-" + i + "' href='#' class=" + title.className + ">" + titleText + "</a></span><span class='marker_address'>" + item.city + ", " + item.province + "</span></div>");

        // document.getElementById("item-"+i).addEventListener("click", function(){
        //     markerclick(item, mylatlng, marker);
        // });

        document.getElementById("item-" + i).addEventListener("mouseover", function () {
            markerclick(item, mylatlng, marker);
        });

        i++;

        return marker;
    });

    // prop_container.find(".heading").text("")

    infoWindow = new google.maps.InfoWindow();

    google.maps.event.addListener(infoWindow, 'closeclick', function () {
        $("#markerlist div").removeClass("active");
    });
    var markerCluster = new MarkerClusterer();
    markercluster(map, markers);
    // Add a marker clusterer to manage the markers.
    // var markerCluster = new MarkerClusterer(map, markers,
    //     {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
}

function markercluster(map, markers) {
    markerCluster = new MarkerClusterer(map, markers, { imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m' });
}

function markerclick(item, latlng, marker) {

    var title = item.property_name;
    var url = item.image;
    var fileurl = item.image;
    var div = panel.find('div');

    $("#markerlist div").removeClass("active");
    $("#markerlist").find("div#" + item.property_id).addClass("active");
    $(".allmarkers").scrollTo("#" + item.property_id, 400);

    var infoHtml = '<div class="info"><style>.info-body {background-image: url("http://localhost/google-map-clusters/googlemapclusters/images/turtle.jpg")}</style><div class="info-body">' + '<img src="http://localhost/google-map-clusters/googlemapclusters/images/turtle.jpg" class="info-img"/></div><div class="info_title"><h3>' + title + '</h3></div>' + '<div class="info_address"><span>' + item.address + '</span></div></div></div>';
    infoWindow.setContent(infoHtml);
    infoWindow.setPosition(latlng);
    // infoWindow.setOptions({disableAutoPan: true});
    infoWindow.open(map, marker);
}

// Everthing about filter starts from here.

function multiFilter(array, filters) {
    var filterKeys = Object.keys(filters);

    // filters all elements passing the criteria
    return array.filter(function (item) {
        // dynamically validate all filter criteria
        return filterKeys.every(function (key) {
            return !!~filters[key].indexOf(item[key]);
        });
    });
}

function filterMarkers(province, type, cursize) {
    clearMarkers();
    var tmpMarkers = [];
    var tmpItems = [];

    var filters = {};
    if (province.length != 0) {
        filters.province = [province];
    }
    if (type.length != 0) {
        filters.type = [type];
    }

    if (cursize.length != 0) {
        filters.size = cursize;
    }

    // console.log("Province - " + province + ", Type - " + type + ", Size - " + cursize);
    for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        item = items[i];

        var tmp = [];
        tmp.push(item);

        var filtered = multiFilter(tmp, filters);
        if (filtered.length != 0) {
            tmpMarkers.push(marker);
            marker.setVisible(true);
        }
    }

    markercluster(map, tmpMarkers);
}

function clearMarkers() {
    markerCluster.clearMarkers();
}

$(document).ready(function () {
    $('.section--full-height').each(function () {
        set_full_height($(this));
    });

    $(".filter_container").change(function () {
        var curprovince = $(this).find(".filter_province select option:selected").attr('value');
        var curtype = $(this).find(".filter_type select option:selected").attr('value');
        var cursize = $(this).find(".filter_size select option:selected").attr('value');
        filterMarkers(curprovince, curtype, cursize);
    });

    setTimeout(function () {
        $(".marker_item").on("click", function () {
            window.location.href = $(this).attr('data-href');
        });
    }, 600);
});
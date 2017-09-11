"use strict";

$(document).foundation();

// To achieve full height section
function set_full_height(section) {
    var window_width = jQuery(window).width();
    var window_height = jQuery(window).height();

    var offsettop = parseInt(jQuery(".filter").css("padding-top"));
    var offsetbtm = parseInt(jQuery(".filter").css("padding-bottom"));
    var totaloffset = offsettop + offsetbtm;

    var filter_height = jQuery(".filter").outerHeight();
    var full_height = window_height - filter_height + 38; // remove header height

    var minimum_height = 400;

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

// Scroll to function without animation
jQuery.fn.scrollTo = function (elem) {
    $(this).scrollTop($(this).scrollTop() - $(this).offset().top + $(elem).offset().top);
    return this;
};

// Function add padding to map bounds
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

function remove(array, element) {
    return array.filter(function (e) {
        return e !== element;
    });
}

// All Functionality starts from here.
var map;
var infoWindow;
var markers = [];
var items = [];
var data = "";
var geocoder = null;

// Created promise to get the data from API
var promise = $.getJSON('http://dev-crombie.pantheonsite.io/properties/search');

promise.done(function (datatest) {
    //   datanew = JSON.parse(data);
    //   datanew = datatest;
    items = datatest;
    console.log(items);
    // google.maps.event.addDomListener(window, 'load', function () {
    //     initMap();
    // });
    setTimeout(function () {
        initMap();
    }, 200);
});

var panel = $("#markerlist");
var maphtml = $("#map");
var prop_container = $("#properties_container");
var filter_container = $('.filter_container');
var titleText;
panel.innerHTML = '';
var curprovince = "";
var curtype = "";
var cursize_from = 0;
var cursize_to = 0;
var cursize_min = 0;
var cursize_max = 0;

var item = document.createElement('DIV');
var title = document.createElement('A');

// Google map styling using Snazzy Maps (https://snazzymaps.com/)
var gmstyles = [{
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{
        "color": "#a7a7a7"
    }]
}, {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [{
        "visibility": "on"
    }, {
        "color": "#737373"
    }]
}, {
    "featureType": "landscape",
    "elementType": "geometry.fill",
    "stylers": [{
        "visibility": "on"
    }, {
        "color": "#efefef"
    }]
}, {
    "featureType": "poi",
    "elementType": "geometry.fill",
    "stylers": [{
        "visibility": "on"
    }, {
        "color": "#dadada"
    }]
}, {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "poi",
    "elementType": "labels.icon",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{
        "color": "#696969"
    }]
}, {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [{
        "color": "#ffffff"
    }]
}, {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{
        "visibility": "on"
    }, {
        "color": "#b3b3b3"
    }]
}, {
    "featureType": "road.arterial",
    "elementType": "geometry.fill",
    "stylers": [{
        "color": "#ffffff"
    }]
}, {
    "featureType": "road.arterial",
    "elementType": "geometry.stroke",
    "stylers": [{
        "color": "#d6d6d6"
    }]
}, {
    "featureType": "road.local",
    "elementType": "geometry.fill",
    "stylers": [{
        "visibility": "on"
    }, {
        "color": "#ffffff"
    }, {
        "weight": 1.8
    }]
}, {
    "featureType": "road.local",
    "elementType": "geometry.stroke",
    "stylers": [{
        "color": "#d7d7d7"
    }]
}, {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [{
        "color": "#808080"
    }, {
        "visibility": "off"
    }]
}, {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [{
        "color": "#d3d3d3"
    }]
}];

var filter_markers_main = function filter_markers_main(data) {
    console.log("filter_markers_main");
    prop_container.find('.properties_data').removeClass("active");
    prop_container.find(".loading_list").addClass("active");

    curprovince = filter_container.find(".filter_province select option:selected").attr('value');
    curtype = filter_container.find(".filter_type select option:selected").attr('value');
    // console.log(curprovince, curtype, cursize_from, cursize_to);

    setTimeout(function () {
        filterMarkers(curprovince, curtype, cursize_from, cursize_to);
    }, 300);
};

// Initialize map
function initMap() {
    // console.log(datanew);
    // var latlng = new google.maps.LatLng(39.91, 116.38);
    var latlng = new google.maps.LatLng(58.186561, -101.439330); // More related to Canada on Map
    var options = '';

    prop_container.find("#markerlist > div").remove();

    /***** MAP Options starts here ******/

    // large and up
    enquire.register("screen and (min-width: 64em)", {
        match: function match() {
            console.log("Map at zoom 4");
            options = {
                // 'zoom': 2,
                'zoom': 4,
                'center': latlng,
                'mapTypeId': google.maps.MapTypeId.ROADMAP,
                styles: gmstyles
            };
        }
    });

    // medium and down
    enquire.register("screen and (max-width: 63.9375em)", {
        match: function match() {
            console.log("Map at zoom 2");
            options = {
                // 'zoom': 2,
                'zoom': 2,
                'center': latlng,
                'mapTypeId': google.maps.MapTypeId.ROADMAP,
                styles: gmstyles
            };
        }
    });
    /***** MAP Options ends here ******/

    // Initiate map here.
    map = new google.maps.Map(document.getElementById('map'), options);

    // Show markers initate
    showmarkers();

    geocoder = new google.maps.Geocoder();

    google.maps.event.addDomListener(window, "resize", function () {
        var center = map.getCenter();
        google.maps.event.trigger(map, "resize");
        map.setCenter(center);
    });

    // Bounds changed event on map
    google.maps.event.addListener(map, 'bounds_changed', function (event) {
        console.log("bounds changed");
        prop_container.find('.properties_data').removeClass("active");
        prop_container.find(".loading_list").addClass("active");
    });

    // var bounds = new google.maps.LatLngBounds();

    var position = '';
    // Idle event on map
    google.maps.event.addListener(map, 'idle', function (event) {
        console.log("idle");
        filter_markers_main();
        console.log("Idle event");
    });
}

function showmarkers() {

    // Create an array of alphabetical characters used to label the markers.
    // var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Add some markers to the map.
    // Note: The code uses the JavaScript Array.prototype.map() method to
    // create an array of markers based on a given "locations" array.
    // The map() method here has nothing to do with the Google Maps API.

    var nonblankitems = [];
    var boundsfit = new google.maps.LatLngBounds();
    markers = items.map(function (item, i) {
        var mylatlng = { lat: parseFloat(item.latitude), lng: parseFloat(item.longitude) };

        if (item.latitude != "" || item.longitude != "") {
            nonblankitems.push(item);
        }

        var marker = new google.maps.Marker({
            position: mylatlng,
            icon: '../images/marker.png'
        });

        marker.set("id", item.property_id);

        marker.addListener('click', function () {

            markerclick(item, mylatlng, marker);
            // map.setZoom(14);
            // map.setCenter(marker.getPosition());
        });

        marker.addListener('mouseover', function () {
            // markerclick(item, mylatlng, marker);
            marker.setIcon("../images/marker-hover.png");
            // map.setZoom(14);
            // map.setCenter(marker.getPosition());
        });

        marker.addListener('mouseout', function () {
            // markerclick(item, mylatlng, marker);
            marker.setIcon("../images/marker.png");
            // map.setZoom(14);
            // map.setCenter(marker.getPosition());
        });

        titleText = item.property_name;

        title.href = '#';
        title.className = 'title';
        title.innerHTML = titleText;

        if (titleText === '') {
            titleText = 'No title';
        }
        panel.append("<div id='" + item.property_id + "' class='marker_item' data-href='" + item.url + "'><style>#" + item.property_id + " .marker_image { background-image: url('" + item.image + "'); }</style><div class='marker_image'><img src='" + item.image + "' alt='' /></div><div class='marker_details'><span class='marker_title'>" + titleText + "</span><span class='marker_address'>" + item.city + ", " + item.province + "</span><span class='property_link'><a href='" + item.url + "'>Know more</a></span></div></div>");

        // document.getElementById("item-"+i).addEventListener("click", function(){
        //     markerclick(item, mylatlng, marker);
        // });

        document.getElementById(item.property_id).addEventListener("mouseover", function () {
            // markerclick(item, mylatlng, marker);
            marker.setIcon("../images/marker-hover.png");
        });
        document.getElementById(item.property_id).addEventListener("mouseout", function () {
            // markerclick(item, mylatlng, marker);
            marker.setIcon("../images/marker.png");
        });

        // For larger screen
        enquire.register("screen and (min-width: 64em)", {
            match: function match() {
                document.getElementById(item.property_id).addEventListener("click", function () {
                    markerclick(item, mylatlng, marker);
                    marker.setIcon("../images/marker-hover.png");
                });
            }
        });

        boundsfit.extend(marker.getPosition());

        i++;

        return marker;
    });

    prop_container.find(".heading").html("<p>" + nonblankitems.length + " PROPERTIES</p>");

    // infoWindow = new google.maps.InfoWindow();
    var ibOptions = {
        maxWidth: 0,
        pixelOffset: new google.maps.Size(-140, 5),
        zIndex: null,
        boxStyle: {
            background: "url('../images/tipbox.gif') no-repeat",
            opacity: 1,
            width: "280px"
        },
        closeBoxMargin: "0",
        closeBoxURL: "../images/closebtn.png",
        infoBoxClearance: new google.maps.Size(10, 10),
        isHidden: false,
        pane: "floatPane",
        enableEventPropagation: false
    };

    infoWindow = new InfoBox(ibOptions);

    var closeInfoBox = document.getElementById("closebtn");

    google.maps.event.addListener(infoWindow, 'closeclick', function () {
        $("#markerlist div").removeClass("active");
    });

    // To recenter map when window resize.
    map.fitBounds(boundsfit);

    // Create new marker cluster
    var markerCluster = new MarkerClusterer();
    console.log("Inside showmarkers");
    markercluster(map, markers);
}

// Function that creates new Markercluster
function markercluster(map, markers) {
    mcOptions = { styles: [{
            height: 53,
            url: "../images/m1.png",
            width: 53
        }, {
            height: 56,
            url: "../images/m2.png",
            width: 56
        }, {
            height: 66,
            url: "../images/m3.png",
            width: 66
        }, {
            height: 78,
            url: "../images/m4.png",
            width: 78
        }, {
            height: 90,
            url: "../images/m5.png",
            width: 90
        }] };
    markerCluster = new MarkerClusterer(map, markers, mcOptions);
    console.log("In Marker Cluster");
}

// Function that runs on marker click. It basically opens Info Window with content
function markerclick(item, latlng, marker) {

    latlng = new google.maps.LatLng(latlng.lat, latlng.lng);

    var title = item.property_name;
    var url = item.image;
    var fileurl = item.image;
    var div = panel.find('div');

    $("#markerlist div").removeClass("active");
    $("#markerlist").find("div#" + item.property_id).addClass("active");
    // $(".allmarkers").scrollTo("#"+item.property_id, 400);

    var infoHtml = '<div class="info"><div id="closebtn"></div><style>.info-body {background-image: url("http://localhost/google-map-clusters/googlemapclusters/images/turtle.jpg")}</style><div class="info-body">' + '<img src="http://localhost/google-map-clusters/googlemapclusters/images/turtle.jpg" class="info-img"/></div><div class="info_title"><h3>' + title + '</h3></div>' + '<div class="info_address"><span>' + item.address + '</span></div><div class="property_link_container"><a class="property_link" href="' + item.url + '">Know More</a></div></div>';
    infoWindow.setContent(infoHtml);
    infoWindow.setPosition(latlng);
    // infoWindow.setOptions({disableAutoPan: true});
    infoWindow.open(map, marker);
}

// Everthing about filter starts from here.

// Multifilter function that provides with new result of array
function multiFilter(array, filters) {
    var filterKeys = Object.keys(filters);
    //   console.log(filters);

    // filters all elements passing the criteria
    return array.filter(function (item) {
        // dynamically validate all filter criteria
        return filterKeys.every(function (key) {
            return !!~filters[key].indexOf(item[key]);
        });
    });
}

function filter_size_range(array, filter_size) {
    // console.log(array);
    // console.log(array[0].field_search_size);
    // console.info("Information----------------------");
    // console.log("Item size"+array[0].field_search_size+" ----- From: "+filter_size.field_search_size_from+" To: "+filter_size.field_search_size_to);
    var tmpsize = parseInt(array[0].field_search_size);
    var tmpfrom = parseInt(filter_size.field_search_size_from);
    var tmpto = parseInt(filter_size.field_search_size_to);
    if (tmpsize >= tmpfrom && tmpsize <= tmpto) {
        // console.log("entered");
        // console.info("++++ True ++++");
        return array;
    }
}

// Filter markers checks the filter and then regenerate markercluster and properties list on side.
function filterMarkers(province, type, cursize_from, cursize_to) {
    console.log("filterMarkers");
    clearMarkers();
    console.log("clearMarkers");
    var tmpMarkers = [];
    var tmpItems = [];

    var filters = {};
    if (province.length != 0) {
        filters.province = [province];
    }
    if (type.length != 0) {
        filters.field_property_type = [type];
    }

    var filter_size = {};
    filter_size.field_search_size_from = [cursize_from];
    filter_size.field_search_size_to = [cursize_to];

    // if(cursize.length != 0)
    // {
    //     filters.field_search_size = cursize;
    // }

    // console.log(filters);

    // console.info("Filters");
    // console.log(filters);

    // console.log("Province - " + province + ", Type - " + type + ", Size - " + cursize);
    for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        item = items[i];

        var tmp = [];
        tmp.push(item);

        var filtered = multiFilter(tmp, filters);
        // console.log(filtered);
        if (filtered.length != 0) {
            var tmpfiltered = filter_size_range(filtered, filter_size);
            // console.log(tmpfiltered);
            if (tmpfiltered) {
                tmpMarkers.push(marker);
                tmpItems.push(item);
                // marker.setVisible(true);   
            }
        }
    }
    // console.info("Tmp Markers");
    // console.log(tmpMarkers);
    // markercluster(map, tmpMarkers);
    // return false;

    console.log("Filter Done");

    var bounds = '';

    enquire.register("screen and (min-width: 64em)", {
        match: function match() {
            bounds = paddedBounds(100, 10, 10, 10); // paddedBounds(north,south,east,west);
        }
    });

    enquire.register("screen and (max-width: 63.9375em)", {
        match: function match() {
            bounds = paddedBounds(10, 10, 10, 10); // paddedBounds(north,south,east,west);
            // console.log(bounds);
        }
    });

    // var bounds = paddedBounds(180, 180, 180, 180); // paddedBounds(north,south,east,west);
    var tmpPadMarkers = [];
    var tmpid = [];
    var k = 0;
    $("#markerlist > div").hide().removeClass("visible");
    for (var i = 0; i < tmpMarkers.length; i++) {
        tmpid.push(tmpMarkers[i].get('id'));

        if (bounds.contains(tmpMarkers[i].getPosition())) {
            // markers[i] in visible bounds
            // console.log("marker id -> "+markers[i].get('id')+"------ latitude -> "+markers[i].position.lat()+"-------- Longitude -> "+markers[i].position.lat());
            // position = new google.maps.LatLng(markers[i].latitude, markers[i].longitude);
            tmpPadMarkers.push(tmpMarkers[i]);
            tmpMarkers[i].setVisible(true);

            $("#markerlist").find("div#" + tmpMarkers[i].get('id')).addClass("visible");
            // console.log(tmpMarkers.length);
            k++;
        } else {
            // markers[i] is not in visible bounds
            tmpMarkers[i].setVisible(false);
            $("#markerlist").find("div#" + tmpMarkers[i].get('id')).removeClass("visible");
        }
    }

    console.log("Out of bound markers gone");
    // console.info("Tmp IDs");
    // console.log(tmpid);
    // console.info("Tmp Pad Markers");
    // console.log(tmpPadMarkers);
    setTimeout(function () {
        // console.log("after 300 ms");
        // Not seeing all Markers so side panel comes out
        maphtml.removeClass("large-12").addClass("large-10");
        prop_container.addClass("active");
        prop_container.find('.properties_data').addClass("active");
        prop_container.find(".loading_list").removeClass("active");
        // prop_container.find(".redosearch").addClass("visible");
        // maphtml.css("width","75%");
        // prop_container.find(".heading").html("<p>" + tmpItems.length + " PROPERTIES</p>");
        // $("#markerlist > div").hide();
        // tmpItems.forEach(function(item, index) {
        //     panel.append("<div id='" + item.property_id + "' class='marker_item' data-href='"+item.url+"'><div class='marker_image'><img src='" + item.image + "' alt='' /></div><div class='marker_details'><span class='marker_title'><a id='item-" + index + "' href='#' class=" + title.className + ">" + item.property_name + "</a></span><span class='marker_address'>" + item.city + ", "+item.province+"</span></div>");
        // });
    }, 300);
    prop_container.find(".heading").html("<p>" + k + " PROPERTIES</p>");
    // console.log(tmpPadMarkers);

    // console.log(tmpPadMarkers);
    console.log("Before marker cluster created");
    markercluster(map, tmpPadMarkers);
    console.log("After marker cluster created");
}

// Just to clear all markers on the map.
function clearMarkers() {
    markerCluster.clearMarkers();
}

// Function to change map zoom and focus based on Selected province
function findAddress(address, zoom) {
    console.log("findAddress");
    if (address != '' && geocoder) {

        geocoder.geocode({ 'address': address
            //   , 'componentRestrictions': {
            //       administrativeArea: 'administrative_area_level_1'
            //   }
        }, function (results, status) {

            if (status == google.maps.GeocoderStatus.OK) {
                // console.info("Map in Geocode");
                // console.log(map);
                if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
                    // map.setCenter(results[0].geometry.location);
                    // console.log(results);
                    if (results && results[0] && results[0].geometry && results[0].geometry.viewport) {
                        map.fitBounds(results[0].geometry.viewport);
                        map.setZoom(zoom);
                    }
                } else {

                    alert("No results found");
                }
            } else {

                alert("Geocode was not successful for the following reason: " + status);
            }
        });
    }
}

// When dom loaded.

$(document).ready(function () {

    $('.section--full-height').each(function () {
        set_full_height($(this));
    });

    var save_range_slider = function save_range_slider(data) {
        cursize_from = data.from;
        cursize_to = data.to;
        cursize_min = data.min;
        cursize_max = data.max;
    };

    // var filter_markers_main =  function (data) {
    //     prop_container.find('.properties_data').removeClass("active");
    //     prop_container.find(".loading_list").addClass("active");

    //     curprovince = filter_container.find(".filter_province select option:selected").attr('value');
    //     curtype = filter_container.find(".filter_type select option:selected").attr('value');
    //     // console.log(curprovince, curtype, cursize_from, cursize_to);

    //     setTimeout(function(){
    //         filterMarkers(curprovince, curtype, cursize_from, cursize_to);
    //     }, 300);
    // }


    // Range slider for Size
    $("#size_filter").ionRangeSlider({
        type: "double",
        extra_classes: "size_filter_container",
        grid: false,
        min: 0,
        max: 200000,
        from: 0,
        to: 200000,
        onStart: function onStart(data) {
            save_range_slider(data);
        },
        onChange: function onChange(data) {
            save_range_slider(data);
        },
        onFinish: function onFinish(data) {
            // save_range_slider(data);
            filter_markers_main(data);
        }
    });

    // Filter Functionality
    var prop_container = $(".properties_container");
    $(".filter_type select").change(function () {
        // console.log("selection changed");
        // prop_container.find('.properties_data').removeClass("active");
        // prop_container.find(".loading_list").addClass("active");
        // curprovince = filter_container.find(".filter_province select option:selected").attr('value');
        // curtype = filter_container.find(".filter_type select option:selected").attr('value');
        // cursize_from = data.from;
        // cursize_to = data.to;

        // setTimeout(function(){
        //     filterMarkers(curprovince, curtype, cursize);
        // }, 300);
        filter_markers_main();
    });

    $(".filter_container .filter_province select").change(function () {
        console.log("On change of select");

        curprovince = $(this).find("option:selected").attr("value");
        if (curprovince == "") {
            curprovince = "58.186561, -101.439330";
            enquire.register("screen and (max-width: 63.9375em)", {
                match: function match() {
                    console.log("Medium or down screen");
                    findAddress(curprovince, 2);
                }
            });

            enquire.register("screen and (min-width: 64em)", {
                match: function match() {
                    console.log("Large screen");
                    findAddress(curprovince, 4);
                }
            });
        }
        // All province that needs Zoom level 5
        else if (curprovince == "Ontario" || curprovince == "Alberta" || curprovince == "Newfoundland and Labrador" || curprovince == "British Columbia") {
                enquire.register("screen and (max-width: 63.9375em)", {
                    match: function match() {
                        console.log("Medium screen with Value");
                        findAddress(curprovince, 4);
                    }
                });

                enquire.register("screen and (min-width: 64em)", {
                    match: function match() {
                        console.log("Large screen with Value");
                        findAddress(curprovince, 5);
                    }
                });
            }
            // All province that needs Zoom level 6
            else if (curprovince == "Manitoba" || curprovince == "Saskatchewan") {
                    enquire.register("screen and (max-width: 63.9375em)", {
                        match: function match() {
                            console.log("Medium screen with Value");
                            findAddress(curprovince, 4);
                        }
                    });

                    enquire.register("screen and (min-width: 64em)", {
                        match: function match() {
                            console.log("Large screen with Value");
                            findAddress(curprovince, 6);
                        }
                    });
                }
                // All province that needs Zoom level 8
                else if (curprovince == "Prince Edward Island") {
                        enquire.register("screen and (max-width: 63.9375em)", {
                            match: function match() {
                                console.log("Medium screen with Value");
                                findAddress(curprovince, 8);
                            }
                        });

                        enquire.register("screen and (min-width: 64em)", {
                            match: function match() {
                                console.log("Large screen with Value");
                                findAddress(curprovince, 8);
                            }
                        });
                    }
                    // All province that needs Zoom level 7 and 6
                    else if (curprovince == "Nova Scotia" || curprovince == "New Brunswick") {
                            enquire.register("screen and (max-width: 63.9375em)", {
                                match: function match() {
                                    console.log("Medium screen with Value");
                                    findAddress(curprovince, 6);
                                }
                            });

                            enquire.register("screen and (min-width: 64em)", {
                                match: function match() {
                                    console.log("Large screen with Value");
                                    findAddress(curprovince, 7);
                                }
                            });
                        }
                        // All province that needs Zoom level 7
                        else {
                                enquire.register("screen and (max-width: 63.9375em)", {
                                    match: function match() {
                                        console.log("Medium screen with Value");
                                        findAddress(curprovince, 5);
                                    }
                                });

                                enquire.register("screen and (min-width: 64em)", {
                                    match: function match() {
                                        console.log("Large screen with Value");
                                        findAddress(curprovince, 7);
                                    }
                                });
                            }
    });

    // setTimeout(function(){
    //     $(".marker_item").on("click", function(){
    //         window.location.href = $(this).attr('data-href');
    //     });
    // }, 600);

    // Refresh list button - We can remove after we finalize scenario
    $(".redosearch a").on("click", function () {
        var curprovince = $(".filter_container").find(".filter_province select option:selected").attr('value');
        var curtype = $(".filter_container").find(".filter_type select option:selected").attr('value');
        var cursize = $(".filter_container").find(".filter_size select option:selected").attr('value');
        var refresh = true;
        filter_markers_main();
    });

    // Load Filter by type options
    setTimeout(function () {
        var filter_type = $(".filter_type");
        var tmpTypes = [];
        var uniqueArray = function uniqueArray(arrArg) {
            return arrArg.filter(function (elem, pos, arr) {
                return arr.indexOf(elem) == pos;
            });
        };

        items.forEach(function (item, index) {
            tmpTypes.push(item.field_property_type);
            // filter_type.find("select").append("<option value='"+item.field_property_type+"'>"+item.field_property_type+"</option>");
        }, this);

        tmpTypes = uniqueArray(tmpTypes);
        // console.log(tmpTypes);
        filter_type.find("select").prepend("<option value=''>Type</option>");
        tmpTypes.forEach(function (item, index) {
            filter_type.find("select").append("<option value='" + item + "'>" + item + "</option>");
        });
    }, 300);

    $(".filter_size .size_filter_container").hide();
    $(".filter_size label").on("click", function () {
        $(this).parent().find(".size_filter_container").toggle("fast", function () {
            $("#size_filter").ionRangeSlider("update");
        });
    });

    // Medium or smaller iPad or less size
    enquire.register("screen and (max-width: 63.9375em)", {
        match: function match() {
            // Tab swithcing
            $(".map_container > div:nth-child(2)").hide();
            $(".tab_container > div:nth-child(1)").addClass("active");
            $(".tab_container > div").on("click", function () {
                if ($(this).hasClass("active")) {
                    return false;
                } else {
                    var tabname = $(this).attr("data-tab");
                    $(".tab_container > div").removeClass("active");
                    $(".map_container > div").removeClass("active").hide();
                    $(this).addClass("active");
                    $(".map_container").find("#" + tabname).fadeIn(600);
                }
                console.log($(".marker_item.visible").length);
            });

            // Property item click to property page
            setTimeout(function () {
                $(".marker_item").on("click", function () {
                    window.location.href = $(this).attr('data-href');
                });
            }, 600);
        }
    });
});
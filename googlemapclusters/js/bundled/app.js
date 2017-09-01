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
    initMap();
});

var panel = $("#markerlist");
var maphtml = $("#map");
var prop_container = $("#properties_container");
var filter_container = $('.filter_container');
var titleText;
panel.innerHTML = '';

var item = document.createElement('DIV');
var title = document.createElement('A');

// Initialize map
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

    geocoder = new google.maps.Geocoder();

    // var tmpMarkers = [];


    // Adding special class on Infowindow for custom style
    google.maps.event.addListener(infoWindow, 'domready', function () {
        $('.info') //the root of the content
        .closest('.gm-style-iw').parent().addClass('custom-iw');
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
        // var bounds = paddedBounds(180, 180, 120, 120); // paddedBounds(north,south,east,west);
        // // clearMarkers();
        // var tmpPadMarkers = [];

        var curprovince = filter_container.find(".filter_province select option:selected").attr('value');
        var curtype = filter_container.find(".filter_type select option:selected").attr('value');
        var cursize = filter_container.find(".filter_size select option:selected").attr('value');
        // console.log("Prop container"+prop_container);
        // console.log(curprovince+" "+curtype+" "+cursize);
        filterMarkers(curprovince, curtype, cursize);
        console.log("Idle event");
        // k = 0;
        // for (var i = 0; i < markers.length; i++) {
        //     // console.log(map.getBounds());
        //     if (bounds.contains(markers[i].getPosition())) {
        //         // markers[i] in visible bounds
        //         // console.log("marker id -> "+markers[i].get('id')+"------ latitude -> "+markers[i].position.lat()+"-------- Longitude -> "+markers[i].position.lat());
        //         // position = new google.maps.LatLng(markers[i].latitude, markers[i].longitude);
        //         tmpPadMarkers.push(markers[i]);
        //         markers[i].setVisible(true);
        //         // $("#markerlist > div").hide();
        //         // $("#markerlist").find("div#" + markers[i].get('id')).addClass("visible").css("display", "block");
        //         // console.log(markers.length);
        //         k++;
        //     } else {
        //         // markers[i] is not in visible bounds
        //         markers[i].setVisible(false);
        //         // $("#markerlist").find("div#" + markers[i].get('id')).removeClass("visible").css("display", "none");
        //     }
        // }
        // markercluster(map, tmpPadMarkers);
        // setTimeout(function () {
        //     if (k != markers.length) {
        //         // Not seeing all Markers so side panel comes out
        //         maphtml.removeClass("large-12").addClass("large-10");
        //         prop_container.addClass("active");
        //         prop_container.find('.properties_data').addClass("active");
        //         prop_container.find(".loading_list").removeClass("active");
        //     } else {
        //         // Seeing all markers on Map so side panel goes away
        //         maphtml.removeClass("large-10").addClass("large-12");
        //         prop_container.removeClass("active").find('.properties_data').removeClass("active");
        //         prop_container.find(".loading_list").removeClass("active");
        //     }
        //     // prop_container.find(".redosearch").addClass("visible");
        //     // maphtml.css("width","75%");
        //     prop_container.find(".heading").html("<p>" + k + " PROPERTIES</p>");
        // }, 300);
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
    // google.maps.event.addDomListener(closeInfoBox, 'click', function(){
    //     infoWindow.close(map, marker);
    //     $("#markerlist div").removeClass("active");
    // });

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

    latlng = new google.maps.LatLng(latlng.lat, latlng.lng);

    var title = item.property_name;
    var url = item.image;
    var fileurl = item.image;
    var div = panel.find('div');

    $("#markerlist div").removeClass("active");
    $("#markerlist").find("div#" + item.property_id).addClass("active");
    // $(".allmarkers").scrollTo("#"+item.property_id, 400);

    var infoHtml = '<div class="info"><div id="closebtn"></div><style>.info-body {background-image: url("http://localhost/google-map-clusters/googlemapclusters/images/turtle.jpg")}</style><div class="info-body">' + '<img src="http://localhost/google-map-clusters/googlemapclusters/images/turtle.jpg" class="info-img"/></div><div class="info_title"><h3>' + title + '</h3></div>' + '<div class="info_address"><span>' + item.address + '</span></div></div></div>';
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

function filterMarkers(province, type, cursize, refresh) {
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

    // console.info("Filters");
    // console.log(filters);

    // console.log("Province - " + province + ", Type - " + type + ", Size - " + cursize);
    for (i = 0; i < markers.length; i++) {
        marker = markers[i];
        item = items[i];

        var tmp = [];
        tmp.push(item);

        var filtered = multiFilter(tmp, filters);
        if (filtered.length != 0) {
            tmpMarkers.push(marker);
            tmpItems.push(item);
            marker.setVisible(true);
        }
    }
    // console.info("Tmp Markers");
    // console.log(tmpMarkers);
    // markercluster(map, tmpMarkers);
    // return false;

    var bounds = paddedBounds(180, 80, 80, 80); // paddedBounds(north,south,east,west);
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

    // if(refresh == true)
    // {
    //     // var bounds = paddedBounds(180, 180, 120, 120); // paddedBounds(north,south,east,west);
    //     // var tmpPadMarkers = [];
    //     // var k=0;
    //     // for (var i = 0; i < tmpMarkers.length; i++) {
    //     //     // console.log(map.getBounds());
    //     //     if (bounds.contains(tmpMarkers[i].getPosition())) {
    //     //         // markers[i] in visible bounds
    //     //         // console.log("marker id -> "+markers[i].get('id')+"------ latitude -> "+markers[i].position.lat()+"-------- Longitude -> "+markers[i].position.lat());
    //     //         // position = new google.maps.LatLng(markers[i].latitude, markers[i].longitude);
    //     //         tmpPadMarkers.push(tmpMarkers[i]);
    //     //         tmpMarkers[i].setVisible(true);
    //     //         $("#markerlist > div").hide();
    //     //         $("#markerlist").find("div#" + tmpMarkers[i].get('id')).addClass("visible").css("display", "block");
    //     //         // console.log(tmpMarkers.length);
    //     //         k++;
    //     //     } else {
    //     //         // markers[i] is not in visible bounds
    //     //         tmpMarkers[i].setVisible(false);
    //     //         $("#markerlist").find("div#" + tmpMarkers[i].get('id')).removeClass("visible").css("display", "none");
    //     //     }
    //     // }
    //     // prop_container.find(".heading").html("<p>" + k + " PROPERTIES</p>");
    //     // console.log(tmpPadMarkers);
    // }
    // else{
    //     setTimeout(function () {
    //         // console.log("after 300 ms");
    //         // Not seeing all Markers so side panel comes out
    //         maphtml.removeClass("large-12").addClass("large-10");
    //         prop_container.addClass("active");
    //         prop_container.find('.properties_data').addClass("active");
    //         prop_container.find(".loading_list").removeClass("active");
    //         // prop_container.find(".redosearch").addClass("visible");
    //         // maphtml.css("width","75%");
    //         prop_container.find(".heading").html("<p>" + tmpItems.length + " PROPERTIES</p>");
    //         $("#markerlist > div").remove();
    //         tmpItems.forEach(function(item, index) {
    //             panel.append("<div id='" + item.property_id + "' class='marker_item' data-href='"+item.url+"'><div class='marker_image'><img src='" + item.image + "' alt='' /></div><div class='marker_details'><span class='marker_title'><a id='item-" + index + "' href='#' class=" + title.className + ">" + item.property_name + "</a></span><span class='marker_address'>" + item.city + ", "+item.province+"</span></div>");
    //         });
    //     }, 300);
    // }

    // document.getElementById("item-" + i).addEventListener("mouseover", function () {
    //     markerclick(item, mylatlng, marker);
    // });

    markercluster(map, tmpPadMarkers);
}

function clearMarkers() {
    markerCluster.clearMarkers();
}

// Function to change map zoom and focus based on Selected province
function findAddress(address) {

    if (address != '' && geocoder) {

        geocoder.geocode({ 'address': address
            //   , 'componentRestrictions': {
            //       administrativeArea: 'administrative_area_level_1'
            //   }
        }, function (results, status) {

            if (status == google.maps.GeocoderStatus.OK) {

                if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
                    console.log(results);
                    if (results && results[0] && results[0].geometry && results[0].geometry.viewport) map.fitBounds(results[0].geometry.viewport);
                } else {

                    alert("No results found");
                }
            } else {

                alert("Geocode was not successful for the following reason: " + status);
            }
        });
    }
}

$(document).ready(function () {
    $('.section--full-height').each(function () {
        set_full_height($(this));
    });
    var prop_container = $(".properties_container");
    $(".filter_container").change(function () {
        console.log("selection changed");
        prop_container.find('.properties_data').removeClass("active");
        prop_container.find(".loading_list").addClass("active");
        var curprovince = $(this).find(".filter_province select option:selected").attr('value');
        var curtype = $(this).find(".filter_type select option:selected").attr('value');
        var cursize = $(this).find(".filter_size select option:selected").attr('value');
        findAddress(curprovince);
        setTimeout(function () {
            filterMarkers(curprovince, curtype, cursize);
        }, 300);
    });

    setTimeout(function () {
        $(".marker_item").on("click", function () {
            window.location.href = $(this).attr('data-href');
        });
    }, 600);

    $(".redosearch a").on("click", function () {
        var curprovince = $(".filter_container").find(".filter_province select option:selected").attr('value');
        var curtype = $(".filter_container").find(".filter_type select option:selected").attr('value');
        var cursize = $(".filter_container").find(".filter_size select option:selected").attr('value');
        var refresh = true;
        filterMarkers(curprovince, curtype, cursize, refresh);
    });
});
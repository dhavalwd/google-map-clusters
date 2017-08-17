$(document).foundation();

// var gmap = {};  

// gmap.items = null;
// gmap.map = null;
// gmap.markerClusterer = null;
// gmap.markers = [];
// gmap.infoWindow = null;

// gmap.init = function() {
    // var latlng = new google.maps.LatLng(39.91, 116.38);
    // var options = {
    //     'zoom': 2,
    //     'center': latlng,
    //     'mapTypeId': google.maps.MapTypeId.ROADMAP
    // };

//     gmap.map = new google.maps.Map($('map'), options);
//     gmap.items = data.photos;
    
//     // var useGmm = document.getElementById('usegmm');
//     // google.maps.event.addDomListener(useGmm, 'click', speedTest.change);
    
//     // var numMarkers = document.getElementById('nummarkers');
//     // google.maps.event.addDomListener(numMarkers, 'change', speedTest.change);

//     gmap.infoWindow = new google.maps.InfoWindow();

//     gmap.showMarkers();
// }

// gmap.showMarkers = function() {
//     gmap.markers = [];

//     // var type = 1;
//     // if ($('usegmm').checked) {
//     //     type = 0;
//     // }

//     // if (speedTest.markerClusterer) {
//     //     speedTest.markerClusterer.clearMarkers();
//     // }

//     var panel = $('markerlist');
//     panel.innerHTML = '';
//     // var numMarkers = $('nummarkers').value;

//     for (var i = 0; i < gmap.items.length; i++) {
//         var titleText = gmap.items[i].photo_title;
//         if (titleText === '') {
//             titleText = 'No title';
//         }

//         var item = document.createElement('DIV');
//         var title = document.createElement('A');
//         title.href = '#';
//         title.className = 'title';
//         title.innerHTML = titleText;

//         panel.append("<div><a href='#'>"+title+"</a></div>");


//         var latLng = new google.maps.LatLng(gmap.items[i].latitude,
//             gmap.items[i].longitude);

//         var imageUrl = 'http://chart.apis.google.com/chart?cht=mm&chs=24x32&chco=' +
//             'FFFFFF,008CFF,000000&ext=.png';
//         var markerImage = new google.maps.MarkerImage(imageUrl,
//             new google.maps.Size(24, 32));

//         var marker = new google.maps.Marker({
//         'position': latLng,
//         'icon': markerImage
//         });

//         var fn = gmap.markerClickFunction(gmap.items[i], latLng);
//         google.maps.event.addListener(marker, 'click', fn);
//         google.maps.event.addDomListener(title, 'click', fn);
//         gmap.markers.push(marker);
//     }

//     // window.setTimeout(speedTest.time, 0);
// }

// gmap.markerClickFunction = function(item, latlng) {
//   return function(e) {
//     e.cancelBubble = true;
//     e.returnValue = false;
//     if (e.stopPropagation) {
//       e.stopPropagation();
//       e.preventDefault();
//     }
//     var title = item.photo_title;
//     var url = item.photo_url;
//     var fileurl = item.photo_file_url;

//     var infoHtml = '<div class="info"><h3>' + title +
//       '</h3><div class="info-body">' +
//       '<a href="' + url + '" target="_blank"><img src="' +
//       fileurl + '" class="info-img"/></a></div>' +
//       '<a href="http://www.panoramio.com/" target="_blank">' +
//       '<img src="http://maps.google.com/intl/en_ALL/mapfiles/' +
//       'iw_panoramio.png"/></a><br/>' +
//       '<a href="' + item.owner_url + '" target="_blank">' + item.owner_name +
//       '</a></div></div>';

//     gmap.infoWindow.setContent(infoHtml);
//     gmap.infoWindow.setPosition(latlng);
//     gmap.infoWindow.open(gmap.map);
//   };
// };

// var gmap = {};  

// // gmap.items = null;
// gmap.map = null;
// // gmap.markerClusterer = null;
// // gmap.markers = [];
// // gmap.infoWindow = null;
var map;
var infoWindow;

var items = data.photos;
var panel = $("#markerlist");
var titleText;
panel.innerHTML = '';

var item = document.createElement('DIV');
var title = document.createElement('A');

function initMap() {

    var latlng = new google.maps.LatLng(39.91, 116.38);
    var options = {
        'zoom': 2,
        'center': latlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map'), options);

    showmarkers();
}

function showmarkers() {
    

    // Create an array of alphabetical characters used to label the markers.
    // var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Add some markers to the map.
    // Note: The code uses the JavaScript Array.prototype.map() method to
    // create an array of markers based on a given "locations" array.
    // The map() method here has nothing to do with the Google Maps API.
    var markers = items.map(function(item, i) {
        var mylatlng = {lat: item.latitude, lng: item.longitude};
        // console.log(mylatlng);
        var marker = new google.maps.Marker({
            position: mylatlng
        });
        
        marker.addListener('click', function() {
            markerclick(item, mylatlng, marker);
        });


        titleText = item.photo_title;

        title.href = '#';
        title.className = 'title';
        title.innerHTML = titleText;

        if (titleText === '')
        {
            titleText = 'No title';
        }
        panel.append("<div><a id='item-"+i+"' href='#' class="+title.className+">"+titleText+"</a></div>");
        // locations[i] = {lat: items[i].latitude, lng: items[i].longitude};

        document.getElementById("item-"+i).addEventListener("click", function(){
            markerclick(item, mylatlng, marker);
        });

        // title.addEventListener('click', function(){
        //     console.log("hello");
        //     markerclick(item, mylatlng, marker);
        // });
        
        i++;
        // console.log(i);

        return marker;
    });
    infoWindow = new google.maps.InfoWindow();
    // Add a marker clusterer to manage the markers.
    var markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
}

function markerclick(item, latlng, marker) {
    
    var title = item.photo_title;
    var url = item.photo_url;
    var fileurl = item.photo_file_url;

    var infoHtml = '<div class="info"><h3>' + title +
    '</h3><div class="info-body">' +
    '<a href="' + url + '" target="_blank"><img src="' +
    fileurl + '" class="info-img"/></a></div>' +
    '<a href="http://www.panoramio.com/" target="_blank">' +
    '<img src="http://maps.google.com/intl/en_ALL/mapfiles/' +
    'iw_panoramio.png"/></a><br/>' +
    '<a href="' + item.owner_url + '" target="_blank">' + item.owner_name +
    '</a></div></div><div><strong>Location:</strong><br/>Latitude: '+item.latitude+',<br/>Longitude: '+item.longitude+'</div>';
    infoWindow.setContent(infoHtml);
    infoWindow.setPosition(latlng);
    infoWindow.open(map, marker);
    
}
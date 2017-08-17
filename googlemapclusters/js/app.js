$(document).foundation();


var map;
var infoWindow;
var markers = [];

var items = data.photos;
var panel = $("#markerlist");
var titleText;
panel.innerHTML = '';

var item = document.createElement('DIV');
var title = document.createElement('A');

function initMap() {

    var latlng = new google.maps.LatLng(39.91, 116.38);
    var options = {
        'zoom': 3,
        'center': latlng,
        'mapTypeId': google.maps.MapTypeId.ROADMAP
    };

    map = new google.maps.Map(document.getElementById('map'), options);

    
    showmarkers();

    var tmpMarkers = [];

    google.maps.event.addListener(map, 'idle', function(event) 
    {
        for (var i = 0; i < markers.length; i++) 
        {
            // console.log(map.getBounds());
            if (map.getBounds().contains(markers[i].getPosition())) 
            {
                // markers[i] in visible bounds
                console.log("marker id -> "+markers[i].get('id')+"------ latitude -> "+markers[i].position.lat()+"-------- Longitude -> "+markers[i].position.lat());
                $("#markerlist div").hide();
                $("#markerlist").find("div#"+markers[i].get('id')).addClass("visible").css("display","block");
                // console.log(markers.length);
            } 
            else 
            {
                // markers[i] is not in visible bounds
                $("#markerlist").find("div#"+markers[i].get('id')).removeClass("visible").css("display","none");
            }
        }

        console.log("map zoomed in or zoomed out or moved or changed");
    });
}

function showmarkers() {

    // Create an array of alphabetical characters used to label the markers.
    // var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    // Add some markers to the map.
    // Note: The code uses the JavaScript Array.prototype.map() method to
    // create an array of markers based on a given "locations" array.
    // The map() method here has nothing to do with the Google Maps API.
    markers = items.map(function(item, i) {
        var mylatlng = {lat: item.latitude, lng: item.longitude};
        // console.log(mylatlng);
        var marker = new google.maps.Marker({
            position: mylatlng
        });

        marker.set("id", item.photo_id);
        
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
        panel.append("<div id='"+item.photo_id+"'><a id='item-"+i+"' href='#' class="+title.className+">"+titleText+"</a></div>");

        // document.getElementById("item-"+i).addEventListener("click", function(){
        //     markerclick(item, mylatlng, marker);
        // });

        document.getElementById("item-"+i).addEventListener("mouseover", function(){
            markerclick(item, mylatlng, marker);
        });
        
        i++;

        return marker;
    });
    infoWindow = new google.maps.InfoWindow();

    google.maps.event.addListener(infoWindow,'closeclick',function(){
        $("#markerlist div").removeClass("active button");
    });
    // Add a marker clusterer to manage the markers.
    var markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
}

function markerclick(item, latlng, marker) {

    var title = item.photo_title;
    var url = item.photo_url;
    var fileurl = item.photo_file_url;
    var div = panel.find('div');

    $("#markerlist div").removeClass("active button");
    $("#markerlist").find("div#"+item.photo_id).addClass("active button");

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
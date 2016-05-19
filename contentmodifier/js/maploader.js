addScript("https://maps.googleapis.com/maps/api/js?v=3&callback=googleCallback");
function googleCallback() {alert('loaded');}

var MapLoader = function(items) {
    this.items = items;
    this.map = null;
    
    //Methods
    this.loadMap = function() {
        console.log('Load map...');
//        this.mapCreated();
    };
    
    this.mapCreated = function() {
        var mapDiv = document.getElementById('lbca_gmap');
        var map = new google.maps.Map(mapDiv, {
            center: {lat: 46.52863469527167, lng: 2.43896484375},
            zoom: 5
        });
        this.map = map;
    }
}

/*------------------------------*\
    HELPER METHODS
\*------------------------------*/

function addScript(url) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    (document.head||document.documentElement).appendChild(script);
}

function setupMarkers(map, pickups) {
    var markers = [];
    var contents = [];
    var infowindow = new google.maps.InfoWindow();
    for (index = 0; index < pickups.length; index++) {
        var pickup = pickups[index];
        markers.push(createMarker(map, pickup, infowindow));
    }
       
    return markers;
}

function createMarker(map, pickup, infowindow) {   
    /* Add marker */
    var position = new google.maps.LatLng(pickup.gpsCoordinates[0], pickup.gpsCoordinates[1]);
    var marker = new google.maps.Marker({
        position: position,
        map: map,
        animation: google.maps.Animation.DROP,
    });
    
    /* Save infowindow content */
    var title = pickup.title;
    var horaire = 'Tous les '+pickup.openingDay+'<br>'+pickup.openingHours;
    var content = 
    '<div id="content">'+
        '<h4 id="firstHeading" class="firstHeading">'+ title +'</h4>'+
        '<div id="bodyContent">'+
            '<p>'+ horaire + '</p>'+
        '</div>'+
    '</div>';
    
    marker.addListener('click', function() {
        infowindow.setContent(content);
        infowindow.open(map, marker);
        map.panTo(marker.getPosition());
        map.setZoom(11);
    });
    
    return marker;
}

function linkTabToggleToMarkerZoom(map, markers) {
    jQuery(function($) {
        $('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
            var index = $(e.target).parent().index();
            if (index < markers.length) {
                var marker = markers[index];
                google.maps.event.trigger(marker, 'click');
            }
        });
    });
}

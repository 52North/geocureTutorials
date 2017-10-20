// geocure base url
const BASEURL = 'http://colabis.dev.52north.org/geocure';

// global object that represents the Leaflet map
var map;
// global reference to layer control
var layercontrol = {};

function initMap() {
    // init map
    map = L.map('map', {
        center: [51.049259, 13.73836], // Dresden center
        zoom: 12,
        // crs: L.CRS.EPSG4326   // changes Leaflet's CRS to EPSG:4326, might be useful for some purposes, but breaks OSM tiles
    });
    
    // add layer control to map
    layercontrol = L.control.layers().addTo(map).expand();

    // add standard OSM tiles as basemap - won't work with EPSG:4326
    layercontrol.addBaseLayer(L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map), '[basemaps] OpenStreetMap (Tiles)');  // set as default
    
    // WMS
    layercontrol.addBaseLayer(L.tileLayer.wms('http://sg.geodatenzentrum.de/wms_webatlasde.light?', {
        layers:'webatlasde.light',
        attribution: '&copy; GeoBasis-DE / <a href="http://www.bkg.bund.de">BKG</a> 2017'
    }), '[basemaps] BKG GeoBasis-DE (WMS)');
    
    /*
    // Alternative when using EPSG:4326
    layercontrol.addBaseLayer(L.tileLayer('http://tiles.geoservice.dlr.de/service/wmts?layer=eoc%3Abasemap&tilematrixset=EPSG%3A4326&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=EPSG%3A4326%3A{z}&TileCol={x}&TileRow={y}', {
        attribution: '&copy; <a href="https://geoservice.dlr.de/">DLR EOC Geoservice</a>'
    }), '[basemaps] DLR (Tiles via WMTS)');
    */
    
    // "Clear" "basemap" in case one of the map's overlays is used as the actual basemap (e.g. urban-atlas-2006-dresden)
    layercontrol.addBaseLayer(L.rectangle([[-90,-180],[90,180]], {fill: false}), '[basemaps] none');

    // example marker
    L.marker([51.049259, 13.73836]).addTo(map).bindPopup('Dresden city centre').openPopup();
}

function getServices() {
    // get all services the RESTAPI provides and list them in the #serviceslist
    $.get(BASEURL + '/services', function(services) {
        services.forEach(function(service) {
            $("#serviceslist").append($('<li>', { id: service.id, text: service.label, title: service.description }).data("href", service.href).click(initService));
        });
    });
}

function initService() {
    // get maps and features and handle them
    $.get($(this).data("href"), function(data) {
        $.get(data.capabilities.maps, addMaps);
        $.get(data.capabilities.features, addFeatures);
    });
}

function addMaps(data) {
    // collect overlays to pass them to the opacity slider later
    var overlays = {};
    
    // Show Dresden bbox (all maps except warning-shapes-fine are clipped to this bbox)
    L.rectangle([[50.990421,13.63266],[51.105678,13.83316]], {color: "#ff7800", weight: 5, fill: false}).addTo(map);
    
    // loop through layers that the service provides
    data.layers.forEach(function(layer) {
        var params = '';
        var imageBounds;
        
        switch(layer.title) {
            case 'warning-shapes-fine':   // all of Germany
                params = '&crs=EPSG:3857';  // set crs to EPSG:3857 so that the returned CRS object will have the same CRS as Leaflet
                imageBounds = [[data.crs.northBoundLatitude, data.crs.westBoundLongitude], [data.crs.southBoundLatitude, data.crs.eastBoundLongitude]];
                break;
            default:   // Dresden
                params = '&bbox=13.63266,50.990421,13.83316,51.105678';  // clip map to custom bbox
                imageBounds = [[51.105678,13.63266],[50.990421,13.83316]];
                break;
        }
        
        // add map to overlays collection
        var imageUrl = layer.href + params;
        var newlayer = L.imageOverlay(imageUrl, imageBounds, {opacity:0.5});
        overlays[layer.title] = newlayer;
        layercontrol.addOverlay(newlayer, '[maps] ' + layer.title);
    });
    
    // add opacity control (sets opacity of all layers together [no individual opacity])
    L.control.layerOpacity({layers: overlays}).addTo(map);
}

function addFeatures(data) {
    // loop through feature sets that the service provides
    data.features.forEach(function(layer) {        
        // defaults
        var params = '';
        var options = {};
        var cluster = false;
        
        switch(layer.title)
        {
            case 'warning-shapes-fine':
                params = '?bbox=47.270362,5.876914,55.044381,15.037507'; // all of Germany
                // in theory it should be possible to use the CRS's bbox for all of Germany :thinkingfaceemoji:
                //params += '?crs=EPSG:3857&bbox=' + [data.crs.southBoundLatitude, data.crs.westBoundLongitude, data.crs.northBoundLatitude, data.crs.eastBoundLongitude].join(',');
                options = {
                    style: function (feature) {
                        return {fillOpacity: 0.1};  // very subtle fill
                    },
                    onEachFeature: function (feature, layer) {
                        // compose popup
                        layer.bindPopup(Object.keys(feature.properties).map((e)=> '<strong>' + e + ':</strong> ' + feature.properties[e]).join("<br>\n"));
                    }
                };
                break;
                
            case 'Heavy Metal Samples':
                // we collect all the timestamps in an array so that an external control could manage which to show when
                //zeitpunkte = [];
                params = '?bbox=13.765706,13.726043,51.086888,51.003874';
                options = {
                    style: function (feature) {
                        // color marker circles green or read according to whether Cd_SUMM exceeds 0.1 µg/g
                        return (parseFloat(feature.properties.Cd_SUMM___micro_g_per_g_) < 0.1) ? {color:'green'} : {color:'red'};
                    },
                    pointToLayer: function(feature, latlng) {
                        // use this to receive marker circles (which can be styled with the function above) instead of simple markers (which cannot)
                        return new L.CircleMarker(latlng, {radius: 10, fillOpacity: 0.85});
                    },
                    filter: function (feature, layer) {
                        // only show values dating from the 27th of July 2012
                        return feature.properties.Timestamp.indexOf('2012-07-27') > -1;
                    },
                    onEachFeature: function (feature, layer) {
                        // compose popup (this time using a table instead of simple "key: value")
                        var html = Object.keys(feature.properties).map((e)=>'<td>' + e.replace('___micro_g_per_g_', '').replace('_', ' ')+'</td><td>' + feature.properties[e] + '</td>').join('</tr><tr>');
                        html = '<table border="1" style="border-collapse:collapse; white-space:nowrap"><tr>'+html+'</tr></table>';
                        layer.bindPopup(html);
                        //zeitpunkte.push(feature.properties.Timestamp);
                    }
                };
                break;
            
            case 'emission-simulation': // formerly known as 'emmission-simulation-results'
                L.rectangle([[51.026888,13.825706],[51.003874,13.765706]], {color: "red", weight: 5, fill: false}).addTo(map);  // bbox
                params = '?bbox=51.003874,13.765706,51.026888,13.825706';
                // no options/popup
                cluster = true;  // cluster these markers because there are MANY (like 20,000+)
                break;
                
            case 'urban-atlas-2006-dresden':
                L.rectangle([[51.076888,13.706043],[51.086888,13.726043]], {color: "green", weight: 5, fill: false}).addTo(map);  // bbox
                params = '?bbox=51.076888,13.706043,51.086888,13.726043';
                options = {
                    style: function (feature) {
                        // color each feature randomly
                        return {
                            color: "#000000".replace(/0/g, ()=>(~~(Math.random()*16)).toString(16)),
                            weight: 2,
                            fillOpacity: 0.4
                        };
                    },
                    filter: function(feature, layer) {
                        // Hide features that are huge
                        return parseFloat(feature.properties.shape_area) < 1000000;
                    },
                    onEachFeature: function (feature, layer) {
                        // fancy popup once more
                        var html = Object.keys(feature.properties).map((e)=>'<td>'+e+'</td><td>' + feature.properties[e] + '</td>').join('</tr><tr>');
                        html = '<table border="1" style="border-collapse:collapse"><tr>'+html+'</tr></table>';
                        layer.bindPopup(html);
                    }
                };
                break;
            
            case 'street-cleaning':
                L.rectangle([[51.030888,13.716043],[51.040888,13.736043]], {color: "purple", weight: 5, fill: false}).addTo(map);  // bbox
                params = '?bbox=51.030888,13.716043,51.040888,13.736043';
                options = {
                    style: function (feature) {
                        // color each feature randomly
                        return {
                            color: "#000000".replace(/0/g, ()=>(~~(Math.random()*16)).toString(16)),
                            weight: 5
                        };
                    },
                    onEachFeature: function (feature, layer) {
                        // fancy popup once more
                        var html = Object.keys(feature.properties).map((e)=>'<td>'+e+'</td><td>' + feature.properties[e] + '</td>').join('</tr><tr>');
                        html = '<table border="1" style="border-collapse:collapse"><tr>'+html+'</tr></table>';
                        layer.bindPopup(html);
                    }
                };
                break;
        } // end switch
        
        // take the configured variables, get the data...
        $.get(layer.href + params, function(geojsonresponse) {
            // parse it
            var newlayer = L.geoJson(geojsonresponse, options);
            // cluster the markers if configured to do so
            if(cluster) { newlayer = L.markerClusterGroup().addLayer(newlayer); }
            // add to map and layer control
            newlayer.addTo(map);
            layercontrol.addOverlay(newlayer, '[features] ' + layer.title);
            // send warning-shapes-fine layer to back because otherwise it blocks other objects from being clicked to see their popups
            if(layer.title == 'warning-shapes-fine') { newlayer.bringToBack(); }
        });        
    }); 
}

$(document).ready(function() {
    // get services at endpoint and provide UI to choose one of them
    getServices();
    // initialise map
    initMap();
});
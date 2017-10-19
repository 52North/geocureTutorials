---
title: Geocure Integration With Leaflet
layout: page
---

# Geocure integration with Leaflet

## Table of Contents
<!-- TOC depthFrom:2 depthTo:6 withLinks:1 updateOnSave:1 orderedList:0 -->

- [Table of Contents](#table-of-contents)
- [Introduction](#introduction)
- [Use Case](#use-case)
- [The Geocure API](#the-geocure-api)
	- [Basic concept](#basic-concept)
	- [Learning by example](#learning-by-example)
		- [Get list of services](#get-list-of-services)
		- [Get capabilities](#get-capabilities)
		- [Get list of maps](#get-list-of-maps)
		- [Get map](#get-map)
		- [Get list of feature layers](#get-list-of-feature-layers)
		- [Get feature layer](#get-feature-layer)
- [App development](#app-development)
	- [Libraries used](#libraries-used)
	- [Code structure](#code-structure)
	- [The basic app](#the-basic-app)
		- [The map pane](#the-map-pane)
		- [Connecting to Geocure](#connecting-to-geocure)
		- [Adding layers](#adding-layers)
			- [Adding raster layers](#adding-raster-layers)
			- [Adding vector layers](#adding-vector-layers)
	- [Geocure parameters](#geocure-parameters)
		- [bbox](#bbox)
	- [Leaflet options](#leaflet-options)
		- [Filtering](#filtering)
		- [Custom styling](#custom-styling)
		- [Custom conversion of point feature to symbol](#custom-conversion-of-point-feature-to-symbol)
		- [Popups](#popups)
	- [Leaflet plugins for advanced stuff](#leaflet-plugins-for-advanced-stuff)
		- [Marker clustering](#marker-clustering)
		- [Opacity control component](#opacity-control-component)
- [Contact](#contact)

<!-- /TOC -->

## Introduction
This developer tutorial will outline and explain the creation process of the [Geocure Demo Client](https://github.com/christophfriedrich/geocure-demo), showcasing different methods, how-tos and best-practices that might help you to make use of [52°North](http://52north.org/)'s [Geocure REST API](https://github.com/52North/geocure) in your own applications.

`TODO: The URL to the GitHub repository points to the developer's personal repository (christophfriedrich). When it is moved into an official repository of 52°North, the URL should be replaced!`

## Use Case
We've got data on the [COLABIS Geoserver](https://geoserver.colabis.de/geoserver/). We want to make it possible to explore this data via a web application. For painless use in our JavaScript app, we want to use the Geocure REST API as a proxy for the Geoserver data.

## The Geocure API

### Basic concept
First things first: We need an **API endpoint** to address our requests to. In this tutorial we will use the permanently deployed Geocure instance at `http://colabis.dev.52north.org/geocure`.

Geocure provides RESTful access to **services** which offer geospatial data. One instance of Geocure can offer access to multiple services.

Data provided by the services is classified into two main distinct categories:
1. Raster data, which is fetched from a Web Map Service (WMS) and therefore called **maps**
2. Vector data, which is fetched from a Web Feature Service (WFS) and therefore called **features**

### Learning by example
Let's get to know how Geocure works by looking at some request examples.

#### Get list of services
To get started, we need a list of the services offered by the Geocure instance. We can retrieve such a list by adding `/services` to our endpoint URL and `GET`ting it:

Request: `GET http://colabis.dev.52north.org/geocure/services`

Response:
````json
[
	{
		"id": "colabis-geoserver",
		"label": "Colabis Geoserver",
		"description": "Offers data of the Colabis project",
		"href": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver"
	}
]
````

In this case, the Geocure instance hosts only one service, labelled "Colabis Geoserver". Every service has a unique `id`, in this case that ID is `colabis-geoserver`.

#### GetCapabilities
Ok, we want to use that promising looking service -- how do we get more information from it? We append the service's `id` to the URL we had so far -- easy!

Request: `GET http://colabis.dev.52north.org/geocure/services/colabis-geoserver`

Response:

````json
{
	"id": "colabis-geoserver",
	"label": "Colabis Geoserver",
	"description": "Offers data of the Colabis project",
	"capabilities": {
		"maps": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver/maps",
		"features": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver/features"
	}
}
````

Ok, not much is new since the metadata from the previous request is repeated, but we've got one new property: `capabilities`.

This property is an object, which again has two properties: `maps` and `features`. As you will have guessed, following the URLs stored in these properties will get you a list of the raster or vector layers (respectively) the Geocure instance offers.

> **EXCURSUS:** If you looked closely at the JSON responses, you probably weren't very surprised what we did next - the URL we used in the next step was always in the previous response. This concept is called hypermedia, or more specifically HATEOAS *("Hypermedia As The Engine Of Application State")*. It means that a response always includes a link to what we could do next. <!--Handy when you don't want to RTFM, uh? ;-)-->

#### Get list of maps
Okay, so let's put those hypermedia links to use and follow them!

Request: `GET http://colabis.dev.52north.org/geocure/services/colabis-geoserver/maps`

````json
{
  "layers": [
    {
      "id": "ckan:_53fbae20_e2fb_4fd1_b5d6_c798e11b96d1",
      "title": "warning-shapes-fine",
      "href": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver/maps/render?layer=ckan:_53fbae20_e2fb_4fd1_b5d6_c798e11b96d1"
    },
    {
      "id": "ckan:_7f1cce1a_62b3_49f3_ac3f_cf73ed1586fa",
      "title": "urban-atlas-2006-dresden",
      "href": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver/maps/render?layer=ckan:_7f1cce1a_62b3_49f3_ac3f_cf73ed1586fa"
    }
  ],
  "crs": {
    "TYPE_NAME": "WMS_1_3_0.EXGeographicBoundingBox",
    "westBoundLongitude": 5.876914,
    "eastBoundLongitude": 15.037507,
    "southBoundLatitude": 47.270362,
    "northBoundLatitude": 55.044381,
    "crs": "EPSG:4326"
  }
}
````

This gives us an object that has an array of available layers as well as information on the coordinate reference system (CRS) that will be used if nothing else will be specified.

*Note: The actual response is longer, four maps (i.e. items of the `layers` array) have been omitted for readability.*

The content of the `layers` array's elements will be no surprise for you either. Each layer has a unique `id`, a more or less descriptive `title` and an `href` link to a rendered representation of the resource.

*Note: In this case, the URL structure to retrieve the resources is not `/maps/<id>` or `/maps/<id>/render`, but instead `/maps/render` takes a list of layers as a `layer` parameter. This is because layers can be stacked and rendered on top of each other in a WMS, so the REST API supports this, too.*

`TODO: Possibly update response if API structure is changed. (talk to Matthes and Niklas)`

#### Get map
Request: `GET http://colabis.dev.52north.org/geocure/services/colabis-geoserver/maps/render?layer=ckan:_53fbae20_e2fb_4fd1_b5d6_c798e11b96d1`

Response: *image of the rendered map in the format that is configured as default, in this case PNG*

#### Get list of feature layers
Not surprinsingly, to get information on the features available, we can do the very same thing:

Request: `GET http://colabis.dev.52north.org/geocure/services/colabis-geoserver/features`

Response:

````json
{
  "features": [
    {
      "id": "_c8b2d332_2019_4311_a600_eefe94eb6b54",
      "title": "Heavy Metal Samples",
      "href": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver/features/_c8b2d332_2019_4311_a600_eefe94eb6b54/data"
    },
    {
      "id": "_9f064e17_799e_4261_8599_d3ee31b5392b",
      "title": "emission-simulation",
      "href": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver/features/_9f064e17_799e_4261_8599_d3ee31b5392b/data"
    }
  ],
  "crs": {
    "TYPE_NAME": "WFS_2_0.FeatureTypeType",
    "westBoundLongitude": 5.876914,
    "eastBoundLongitude": 15.037507,
    "southBoundLatitude": 47.270362,
    "northBoundLatitude": 55.044381,
    "crs": "EPSG:4326"
  }
}
````

*Note: Again, three features have been removed for readability.*

The structure of the response is the very same as for the maps. The only exception is that the URLs to retrieve the resources follow a slightly different pattern: `/features/<id>/data`.

*Note: This is because features -- in contrast to maps -- can't be stacked.*

#### Get feature layer
The response when retrieving a feature layer is a GeoJSON object. GeoJSON is a de facto standard ([RFC 7046](https://tools.ietf.org/html/rfc7946)) for encoding geospatial information in JSON notation.

Request: `GET http://colabis.dev.52north.org/geocure/services/colabis-geoserver/features/_c8b2d332_2019_4311_a600_eefe94eb6b54/data`

Response:

````json
{
  "type": "FeatureCollection",
  "totalFeatures": 46,
  "features": [
    {
      "type": "Feature",
      "id": "_c8b2d332_2019_4311_a600_eefe94eb6b54.fid-4498c75b_15bec2edbdc_6ed0",
      "geometry": {
        "type": "Point",
        "coordinates": [
          13.726043,
          51.003874
        ]
      },
      "geometry_name": "Shape",
      "properties": {
        "X": 51.003874,
        "Y": 13.726043,
        "Timestamp": "2012-07-20T07:00:00Z",
        "Place": "Bannewitz",
        "Zn_SUMM___micro_g_per_g_": 377.8245751,
        "Cu_SUMM___micro_g_per_g_": 105.0860617,
        "Cd_SUMM___micro_g_per_g_": 0.1663264
      }
    }
  ],
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:EPSG::4326"
    }
  }
}
````

*Note: Obviously, this response has been massively shortened, too: 45 features have been omitted.*

The mapping library we're going to use for our app natively supports GeoJSON, so this format is very handy for us.

## App development
Let's start with the real thing!

### Libraries used
We don't want to make everything from scratch, so we'll use these libraries to make our lives easier:

* [**Leaflet**](http://leafletjs.com/) as a very lightweight and handy mapping engine
* [**jQuery**](https://jquery.com/) for painless AJAXing and a bit of eventing and DOM manipulation

### Code structure
We will organise our code into three files: `index.html` holds the HTML document, `style.css` its style definitions and `app.js` our JavaScript code. Pretty straight forward.

So far, we've had a good look at how the API works. What for? Because our application basically has to do the very same things we just did by hand:

> We give it an API endpoint, it requests the available services and lets us choose one. When we've made up our mind, it should request the capabilities and available maps and features and then add these to our map.

So in short the steps our app has to do are:
1. Show map
2. Request available services from API endpoint
3. Let user choose one
4. Request capabilities
5. Add maps and features to map

We can pretty much take this list of steps and write a function for each:
1. `initMap`
2. `getServices`
3. *provide UI for choosing*
4. `initService`
5. `addMaps` / `addFeatures`

### The basic app

#### The map pane
The main component of our app will be the map pane. Thanks to Leaflet, adding one to our site is as easy as inserting an empty DIV into our HTML, giving it a defined height and adding a handful of lines of JavaScript:

The `index.html`
````html
<html>
<head>
	<title>Geocure REST API Demo Client</title>
	<!-- Leaflet includes -->
	<link rel="stylesheet" href="https://unpkg.com/leaflet@1.0.3/dist/leaflet.css" />
	<script src="https://unpkg.com/leaflet@1.0.3/dist/leaflet.js"></script>
	<!-- jQuery includes -->
	<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
	<!-- our stuff -->
	<link rel="stylesheet" href="style.css" />
	<script src="app.js"></script>
</head>
<body>
	<!-- the element we want our map to be in -->
	<div id="map"></div>
</body>
</html>
````

The `style.css`
````css
#map {
    height: 400px;
}
````

The `app.js`
````js
// we'll need that reference again and again
var map;

function initMap() {
	// The `L` object holds all the Leaflet stuff
	// Take the div with the 'map' id as the container
	// plus options for the initial position and extent
	map = L.map('map', {
		center: [51.049259, 13.73836], // Dresden city center
		zoom: 12
	});

	// add standard OSM tiles as basemap
	// (leaflet automatically fills in the placeholders when zooming and panning)
	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);  // put it on the map
}

// fire our function when the page is ready
$(document).ready(function() {
    initMap();
});
````

With this example we can already explore the base map in our app.

#### Connecting to Geocure
Let's bring in the Geocure stuff.

Remember this from above?

> Request: `GET http://colabis.dev.52north.org/geocure/services`
>
> Response:
> ````json
> [
> 	{
> 		"id": "colabis-geoserver",
> 		"label": "Colabis Geoserver",
> 		"description": "Offers data of the Colabis project",
> 		"href": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver"
> 	}
> ]
> ````

We'll transform this request into code and add logic for handling the response:

````js
function getServices() {
	// get services information with AJAX GET request
	$.get(BASEURL + '/services', function(services) {
		// `services` is the json response. As you saw on top, it's an array, so loop through it
		services.forEach(function(service) {
			// for each: add item to the serviceslist
			$("#serviceslist").append($('<li>', { text: service.label }).data("href", service.href).click(initService));
		});
	});
}
````

When one clicks the text of a serviceslist item, `initService()` is called (without parameters). That function extracts the `href` link from the item's data set (thanks HTML5) and retrieves the capabilities by `GET`ting that link. The response contains `maps` and `features` properties, which hold the URL to the list of available maps/features respectively. In the next step, the two URLs are retrieved too and the requests' results delegated to the respective function.

````js
function initService() {
    // get maps and features and handle them
    $.get($(this).data("href"), function(data) {
        $.get(data.capabilities.maps, addMaps);
        $.get(data.capabilities.features, addFeatures);
    });
}
````

#### Adding layers
We'll administrate the layers through a layer control component. Like the `map` reference we keep this reference global and initiate it in the `initMap()` function.
````js
var layercontrol;
...
function initMap()
{
	...
	// initiate, and then show on map in expanded state
	layercontrol = L.control.layers().addTo(map).expand();
	...
}
````

##### Adding raster layers
The `addMaps` function is passed the JSON response from `GET <BASEURL>/services/<id>/maps` as [described above](#get-list-of-maps).

````js
function addMaps(data) {
    // loop through layers that the service provides
    data.layers.forEach(function(layer) {
        // clip map to custom bbox
        var params = '&bbox=13.63266,50.990421,13.83316,51.105678';
        var imageBounds = [[51.105678,13.63266],[50.990421,13.83316]];

        // add map to map pane
        var imageUrl = layer.href + params;
        var newlayer = L.imageOverlay(imageUrl, imageBounds, {opacity:0.5});
        layercontrol.addOverlay(newlayer, '[maps] ' + layer.title);
    });
}
````

With this code, an entry for each map layer is generated in the laycer control component. When the user selects a map from the component, Leaflet will automatically retrieve the picture and overlay it on the map for us.

##### Adding vector layers
Geocure returns the requested vector data as GeoJSON.

Unlike with the maps, in this case we have to provide Leaflet with the actual data instead of the URL to it, i.e. we have to download that GeoJSON ourselves and pass it to the `L.geoJson` function, which turns it into a Leaflet layer.

The individual vector data sets provided by the COLABIS Geoserver differ a lot. Some contain a few areas, others thousands of points, others mixed content. Therefore we have to handle each layer differently -- there is no "one fits all" solution. That's why we introduce the `params` and `options` variables which are filled in a huge `switch` statement, assigning predefined values depending on the layer's title.

````js
function addFeatures(data) {
    // loop through feature sets that the service provides
    data.features.forEach(function(layer) {        
        // defaults
        var params = '';
        var options = {};

        switch(layer.title)
        {
            // assign params and options
            ...
        }

        // take the configured variables, get the data...
        $.get(layer.href + params, function(geojsonresponse) {
            // parse it
            var newlayer = L.geoJson(geojsonresponse, options);
            // add to map and layer control
            newlayer.addTo(map);
            layercontrol.addOverlay(newlayer, '[features] ' + layer.title);
        });
    });
}
````

See the following chapter [Leaflet options](#leaflet-options) for examples of `params` and `options` or consult the source code for the full example.

### Geocure parameters

#### bbox
Geocure accepts a bbox parameter. We use that like this:

````js
switch(layer.title) {
	case 'warning-shapes-fine':
		params = '?bbox=5.876914,47.270362,15.037507,55.044381';
	[...]
}
````

I.e. the order is: West, South, East, North
aka: Lower left and upper right coordinates in Longitude-Latitude order
Or, more general: minX, minY, maxX, maxY.

### Leaflet options

#### Filtering
Leaflet provides a handy way to show only those features that meet certain conditions. This is implemented with a function: Every feature is passed to it, and only the features for which the function returns true are kept -- all others will be hidden.

For example, the `urban-atlas-2006-dresden` layer has a `shape_area` property for every feature. We want to display only features that cover less than 1 million square meters, so we add the `filter` attribute to the Leaflet layer's options like this:

````js
filter: function(feature, layer) {
	// Hide features that are huge
	return parseFloat(feature.properties.shape_area) < 1000000;
},
````

#### Custom styling
The features of `warning-shapes-fine` should have only a subtle fill. We can achieve this by defining our custom style function:

````js
style: function (feature) {
	return {fillOpacity: 0.1};
},
````

The function is called for every feature, so we can also use the features attributes to specify conditional styling. For example, we use this to color the `Heavy Metal Samples` according to whether they exceed a certain value or not:

````js
style: function (feature) {
	return (parseFloat(feature.properties.Cd_SUMM___micro_g_per_g_) < 0.1) ? {color:'green'} : {color:'red'};
},
````

Features with total Cadmium levels below 0.1 µg/g will be green, features exceeding *(or equaling)* this value will be red.

#### Custom point feature symbols
By default, adding point features to Leaflet results in markers being created. Sadly, styling markers is not really supported in Leaflet (an image is used to display markers, so one would have to replace that image to achieve e.g. a custom color).

We deal with that by supplying our custom `pointToLayer` function. Instead of having markers generated automatically for us, we create the needed objects ourselves. This allows us to have circles instead of markers, and circles are easy to style.

````js
pointToLayer: function(feature, latlng) {
	return new L.CircleMarker(latlng, {radius: 10, fillOpacity: 0.85});
},
````

Without this tweak, the custom style in `Heavy Metal Samples` layer would not have been possible the way we did it. Instead of a custom `style` function we would have had to specify an alternative image to use for the markers.

#### Popups
Users should be able to view the metadata attached to the features on our map. The easiest way to achieve this are popups which open up when the user clicks the feature.

We have to attach an individual popup to every feature that should have one. For this, the `onEachFeature` function comes in handy:

````js
onEachFeature: function (feature, layer) {
	// compose popup and bind it to the feature
	layer.bindPopup(
		// for every key in the `properties` list
		Object.keys(feature.properties).map(
			// make the key name bold
			(e) => '<strong>' + e + ':</strong> '
			// and add its value
			+ feature.properties[e]
		// have every key value pair on its own line
		).join("<br>\n")
	);
}
````

*Note: It has to be `layer.bindPopup`, and NOT `feature.bindPopup`. This seems inconsistent but makes sense when considering that Leaflet internally creates an individual layer for every single feature.*

### Leaflet plugins for advanced stuff

#### Marker clustering
Having heaps of markers has some major drawbacks: The map is flooded with symbols so that one can't see the basemap anymore, clicking one individual marker gets very hard and on top of that the whole app performs sluggish.

The solution is marker clustering: Grouping markers into one symbol until the zoom level is so high that markers can be displayed independently.

We use the [Marker Clustering Plugin](https://github.com/Leaflet/Leaflet.markercluster) for Leaflet to do that for us. In the code of the `addFeatures` function (see section [Adding vector layers](#adding-vector-layers)) we alter the `newlayer` creation like this:

````js
// create new layer like before
var newlayer = L.geoJson(geojsonresponse, options);
// NEW: if clustering requested: wrap in markerClusterer
if(cluster) { newlayer = L.markerClusterGroup().addLayer(newlayer); }
// add new layer to map like before
newlayer.addTo(map);
````

That's it, the plugin does all the rest for us. (The variable `cluster` is set to `true` in the huge `switch` statement if clustering should be done for the layer in question.)

#### Opacity control component
Especially when dealing with multiple raster layers on top of each other, the base map  might become hard to see, so allowing control of the raster layer's opacity would be handy. Let's use the [Leaflet layer opcaity control by *azoletwork*](https://github.com/azoletwork/leaflet-layer-opacity-control) for that.

````js
function addMaps(data) {
	// collect overlays to pass them to the opacity slider later
	var overlays = {};

[...]
	// for each map
		// create new layer as before
		var newlayer = L.imageOverlay(imageUrl, imageBounds, {opacity:0.5});
		// collect in overlays object
		overlays[layer.title] = newlayer;
[...]

	// after that: add opacity slider to map
	L.control.layerOpacity({layers: overlays}).addTo(map);
}
````

*NOTE: A more powerful component that allows individual opacity control for each layer would be handy, but I couldn't find one and so far didn't bother making one myself.*

## Contact
The Geocure Demo Client was developed by [Christoph Friedrich](https://github.com/christophfriedrich/). Contact via [E-Mail](mailto:c.friedrich@52north.org).

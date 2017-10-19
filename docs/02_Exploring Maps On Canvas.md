---
title: Exploring Maps On Canvas
layout: page
---

## About this tutorial

In this tutorial, a very lightweight web map information application is developed.
On the frontend, we are going to use just HTML and javascript.
Bootstrap and jQuery will make our lives a little bit easier.
On the backend, geocure serves the image data and the requested information.
The final files of this tutorial can be found in the github repository of this tutorial.

### Let's start

We start with the setup of the project structure:

```
root
|__ index.html
|__js
|   |__ app.js
|__css
    |___ style.css
```

Lets have a look at our html:


```html
<html>

<head>
    <title>Geocure REST API Demo Client</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.12.4/css/bootstrap-select.min.css">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <link rel="stylesheet" href="css/style.css" />

    <script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap-select/1.12.4/js/bootstrap-select.min.js"></script>
    <script src="js/app.js"></script>
</head>

<body>
    <nav class="navbar navbar-toggleable-md navbar-inverse bg-inverse fixed-top">
        <div>
            <select class="selectpicker" , id="availableMaps">
                <option>Select a map</option>
            </select>
        </div>
    </nav>

    <div class="row">
        <div class="col-12">
            <div id="outer"
                <div id='canvas-container'>
                    <canvas id="mapCanvas" height="1500" width="1500"></canvas>
                </div>
            </div>
        </div>
    </div>

</body>

<!-- Modal -->
<!-- Addapted from https://www.w3schools.com/bootstrap/bootstrap_modal.asp -->
<div class="modal fade" id="myModal" role="dialog">
    <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Response from getFeatureInfo</h4>
            </div>
            <div class="modal-body">
                <pre id="json"></pre>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>

</html>
```

As you can see, it is really simple.
We have a canvas, which we use to show the raster data.
At the bottom of the document, there is a modal described. We use it to show information about the clicked point on the map.
If you are new to modals and want to learn more about it, [v4-alpha.getbootstrap](https://v4-alpha.getbootstrap.com/components/modal/) provides a good introduction.

Lets cover quick the css, so we can finaly start with the javascript part.

```css
#mapCanvas {
  display: table;
  margin: 0 auto;
  margin-top: 20px;
  margin-bottom: 20px;
  overflow: scroll;
  box-shadow: 10px 10px 5px grey;
  outline: black 3px solid;
}

```
We are just styling the canvas, so it has a nice 3D effect.

After finishing the styling, we can start with the logic.
We start with a sketch, of what we want to archive:

```javascript
window.onload = function() {
  getAvailableMaps()
    .then(addMapsToSelectOptions)
    .then(selectedMapAction).catch(error => {alert('error: ' + error)});
}
```
When the page loaded, we want to have all available maps from geocure.
The result we are using to build a drop-down selection, so the user can switch between different images.
On the selection action, we want to take certain actions. So we are going to create these. If an error occurs, we use alert.

As we want to avoid errors, we already placing the empty functions in our app.js
If you are surprised by the return new Promise statement, do not worry.
It is a great feature and style, making many sequences of steps more expressive.
You want to read more about this? [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) is a good starting point.

```javascript

function getAvailableMaps() {
  return new Promise((resolve, reject) => {
    try {

    }
    catch(error) {
      reject(error)
    }
  });
};
```

```javascript
function addMapsToSelectOptions(availaleMaps) {
  return new Promise((resolve, reject) => {
    try {

    }
    catch(error) {
      reject(error);
    }
  });
};
```

```js
function selectedMapAction() {
  return new Promise((resolve, reject) => {
    try {

    }
    catch(error) {
      reject(error);
    }
  });
};
```


In the following we are going to fill these functions with live.

### getAvailableMaps()

To get these information, we are asking geocure. The endpoint */map* delevieres the needed information.

To make things easier we place at the very top of app.js the static part of our used geocure. From this we are building our needed request urls.

```javascript
const host = 'http://colabis.dev.52north.org/geocure'; // URL to geocure
const service = '/services/colabis-geoserver'; // service, offered by geocure;
```

To request the information, we are using *.get* from jQuery and resolve the result.

```javascript
function getAvailableMaps() {
  return new Promise((resolve, reject) => {
    try {
      // Construct url to request available maps from geocure
      const availableMaps = host + service +'/map'
      console.log(availableMaps);
      // Requesting available maps from geocure
      $.get(availableMaps, availaleMaps => {
        resolve(availaleMaps);
      }).fail(() => {
        throw "Error in requesting available maps."
      });
    }
    catch(error) {
      reject(error)
    }
  });
};
```
The result will be an object like this.
Due to limited space, we are just showing an extract of the data we are working whith.

```json
{
  "layers": [
    {
      "id": "ckan:_2518529a_fbf1_4940_8270_a1d4d0fa8c4d",
      "title": "dwd-kreise",
      "href": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver/map/render?layer=ckan:_2518529a_fbf1_4940_8270_a1d4d0fa8c4d"
    },
    {
      "id": "ckan:_53fbae20_e2fb_4fd1_b5d6_c798e11b96d1",
      "title": "warning-shapes-fine",
      "href": "http://colabis.dev.52north.org/geocure/services/colabis-geoserver/map/render?layer=ckan:_53fbae20_e2fb_4fd1_b5d6_c798e11b96d1"
    }
  ],
  "crs": {
    "TYPE_NAME": "WMS_1_3_0.EXGeographicBoundingBox",
    "westBoundLongitude": 5.86599881341562,
    "eastBoundLongitude": 15.037743335938,
    "southBoundLatitude": 47.270362,
    "northBoundLatitude": 55.057374701071,
    "crs": "EPSG:4326"
  }
}
```

The *layers* value contains the needed information. The next function will process it.


### addMapsToSelectOptions(availaleMaps)

Taking the result from the previous, we are going to build the content of our map selection.
```javascript
function addMapsToSelectOptions(availaleMaps) {
  return new Promise((resolve, reject) => {
    try {
      let map = availaleMaps.layers; // Accessing an array of map resource opjects.

      for(let i = 0; i <= map.length; i++) {
        if(i == map.length) {
          resolve(); // If no elements of the array are to access: finished -> resolve
          return;
        }
        else {
          // Do this with the array
          let option = $('<option>').text(map[i].title).attr('href', map[i].href);
          $('#availableMaps').append(option).selectpicker('refresh');
        }
      }
    }
    catch(error) {
      reject(error);
    }
  });
};
```

Here, the RESTful JSON interface shows its power.
We can easily iterate over the array and assign the next resource (in this case an image) to it.


### selectedMapAction()
What is missing now, is some action triggered by a selecting an option from the drop-down menu.

What we want to have is the following:

  -  Depending on the selection, we want to change the image on our canvas.

  - Furthermore, we want to place or update an event listener on the canvas. This event listener delivers the information to the clicked position on the canvas. As the event depends on the map, we have to update it on every image change.


```javascript
function selectedMapAction() {
  return new Promise((resolve, reject) => {
    try {
      $('#availableMaps').change(function(){

        // Get from the selcted option the assigned url
        let linkToMap = $("#availableMaps option:selected").attr('href');

        if(linkToMap) { // Having the url we run through the wanted actions
          exchangeMapOnCanvas(linkToMap).then(updateCanvasEventlistener).then(resolve);
        }
        resolve()
      });
    }
    catch(error) {
      reject(error);
    }
  });
};
```

### exchangeMapOnCanvas(linkToMap)

Placing an image on the canvas it straightforward.
We just need to get the size of the image we want to request (
In our case, it is the width and height of the canvas) and combine it with its URL.
The URL is delivered from the previous step.

```javascript
function exchangeMapOnCanvas(linkToMap) {
  return new Promise((resolve, reject) => {
    try {

        // size is the one from the canvas
        let size = '&height=' + $('#mapCanvas').attr('height') + '&width=' + $('#mapCanvas').attr('width');

        let imageRequestURL = linkToMap + size;
        console.log(imageRequestURL);

        var canvas =document.getElementById('mapCanvas');
        var context = canvas.getContext('2d');


        var imageObj = new Image();
        imageObj.onload = function() {
          context.drawImage(this, 0, 0);
          resolve(linkToMap);
        };
        imageObj.src = imageRequestURL;

    }
    catch(error) {
      reject(error);
    }
  });
};
```

### exchangeMapOnCanvas(linkToMap)

After we placed an image on the canvas, we want to request corresponding information, based on the click position.
And again, it is quite straightforward.

```javascript
function updateCanvasEventlistener(linkToMap) {
  return new Promise((resolve, reject) => {
    try {

      let basisInfoURl = service + '/map/info?';
      let currentLayer = linkToMap.match(/layer=.*[^\/]/);

      // size is the one from the canvas
      let size = '&height=' + $('#mapCanvas').attr('height') + '&width=' + $('#mapCanvas').attr('width');


      $('#mapCanvas').off() // Remove all eventlisteners, added with .on

      $('#mapCanvas').on('click', event => {

        var x = event.offsetX;
        var y = event.offsetY;

        let infoRequestUrl = host + basisInfoURl + currentLayer + size + '&x=' + x + '&y=' + y;
        console.log(infoRequestUrl)

        $.get(infoRequestUrl, function(res) {
          $('#json').empty(); // Empty div in modal
          $('#json').append(JSON.stringify(res, null, 2)); // Put the response into the clean json div
          $('#myModal').modal(); // open the modal
          resolve();
        });
      });


    }
    catch(error) {
      reject(error);
    }
  });
}
```

## Result
After the implementation of this last function, we are able to receive with a click on our map corresponding information.
Using geocures RESTful, JSON based, interface, the integration of geodata was very easy. We just needed the right endpoint and were then directly able to integrate the response in our application.

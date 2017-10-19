const host = 'http://colabis.dev.52north.org/geocure'; // URL to geocure
const service = '/services/colabis-geoserver'; // service, offered by geocure;

window.onload = function() {
  getAvailableMaps()
    .then(addMapsToSelectOptions)
    .then(selectedMapAction).catch(error => {alert('error: ' + error)});
}


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

// We changed the image, so the url for information requests has to change.
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

let map;
let initialLocation = { lat: -25.2744, lng: 133.7751 }; // Australia coordinates
let infoWindow = null;
let markers = {};
function initMap() {
  if (window.location.href.includes('en-nz')) {
    initialLocation = { lat: -36.8485, lng: 174.7633 }; // Auckland
  }

  const mapStyle = new google.maps.StyledMapType( [
      {
        "featureType": "administrative.locality",
        "elementType": "all",
        "stylers": [
            {
                "hue": "#000"
            },
            {
                "saturation": 7
            },
            {
                "lightness": 19
            },
            {
                "visibility": "on"
            }
        ]
      },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "saturation": "-3"
            }
        ]
      },
      {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#000"
            }
        ]
      },
      {
        "featureType": "landscape",
        "elementType": "all",
        "stylers": [
            {
                "hue": "#000"
            },
            {
                "saturation": "-80"
            },
            {
                "lightness": "-1"
            },
            {
                "visibility": "simplified"
            }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "all",
        "stylers": [
            {
                "hue": "#ff0000"
            },
            {
                "saturation": -100
            },
            {
                "lightness": 100
            },
            {
                "visibility": "off"
            }
        ]
      },
      {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "lightness": "-53"
            },
            {
                "visibility": "off"
            }
        ]
      },
      {
        "featureType": "poi.school",
        "elementType": "geometry.fill",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#a78ba7"
            },
            {
                "lightness": "40"
            }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "saturation": "100"
            },
            {
                "lightness": 31
            },
            {
                "visibility": "simplified"
            },
            {
                "color": "#efc6df"
            }
        ]
      },
      {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "color": "#f39247"
            },
            {
                "saturation": "0"
            },
            {
                "visibility": "simplified"
            }
        ]
      },
      {
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
            {
                "saturation": -93
            },
            {
                "lightness": 31
            },
            {
                "visibility": "on"
            }
        ]
      },
      {
        "featureType": "road",
        "elementType": "labels.text",
        "stylers": [
            {
                "weight": "4.00"
            },
            {
                "saturation": "-91"
            }
        ]
      },
      {
        "featureType": "road",
        "elementType": "labels.icon",
        "stylers": [
            {
                "saturation": "1"
            },
            {
                "lightness": "1"
            },
            {
                "gamma": "1.00"
            },
            {
                "visibility": "on"
            }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "saturation": "100"
            },
            {
                "lightness": "10"
            }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "lightness": "1"
            }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "labels.icon",
        "stylers": [
            {
                "weight": "10.00"
            },
            {
                "visibility": "on"
            },
            {
                "lightness": "-2"
            }
        ]
      },
      {
        "featureType": "road.highway.controlled_access",
        "elementType": "all",
        "stylers": [
            {
                "saturation": "0"
            },
            {
                "lightness": "10"
            }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "geometry.stroke",
        "stylers": [
            {
                "visibility": "on"
            },
            {
                "color": "#d684d3"
            },
            {
                "saturation": "0"
            }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "labels",
        "stylers": [
            {
                "hue": "#bbc0c4"
            },
            {
                "saturation": -93
            },
            {
                "lightness": -2
            },
            {
                "visibility": "simplified"
            }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "labels.text",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
            {
                "hue": "#007fff"
            },
            {
                "saturation": "-100"
            },
            {
                "lightness": "14"
            },
            {
                "visibility": "simplified"
            }
        ]
      },
      {
        "featureType": "transit",
        "elementType": "all",
        "stylers": [
            {
                "hue": "#e9ebed"
            },
            {
                "saturation": 10
            },
            {
                "lightness": 69
            },
            {
                "visibility": "on"
            }
        ]
      },
      {
          "featureType": "water",
          "elementType": "all",
          "stylers": [
              {
                  "hue": "#007fff"
              },
              {
                  "saturation": "-100"
              },
              {
                  "lightness": "100"
              },
              {
                  "visibility": "simplified"
              }
          ]
      }
  ]);

  map = new google.maps.Map(document.getElementById('map'), {
    center: initialLocation,
    zoom: 5,
    mapId: "SKINKANDY_MAP",
  });

  map.mapTypes.set("styled_map", mapStyle);
  map.setMapTypeId("styled_map");

  map.data.loadGeoJson('https://shopifyapi.skinkandyonline.com.au/api/store-locations', {idPropertyName: 'storeid'});

  map.data.setStyle((feature) => {
    return {
      icon: {
        url: `https://cdn.shopify.com/s/files/1/0555/7508/5194/files/MapPin_1.png`,
        scaledSize: new google.maps.Size(30, 40),
      },
      title: "Location Marker"
    };
  });

  infoWindow = new google.maps.InfoWindow();

  map.data.addListener('click', (event) => {
    const name = event.feature.getProperty('name');
    const address = event.feature.getProperty('address');
    const hours = event.feature.getProperty('hours');
    const phone = event.feature.getProperty('phone');
    const position = event.feature.getGeometry().get();
    const website = event.feature.getProperty('website');

    const content = `
      <div style="margin-bottom:20px;">
        <h6 style="text-transform:uppercase;">${name}</h6>
        <p>${address}</p>
        <p><b>Open:</b><br> ${hours}<br/><b>Phone:</b> ${phone}</p>
        <a href="${website}" class="website-link" target="_blank">Visit Page</a>
        <a href="https://www.google.com/maps/search/?api=1&query=${position.lat()},${position.lng()}" class="website-link" target="_blank">Get Directions</a>
      </div>
    `;

    infoWindow.setContent(content);
    infoWindow.setPosition(position);
    infoWindow.setOptions({pixelOffset: new google.maps.Size(0, -30)});
    infoWindow.open(map);
  });

  const input = document.getElementById("autocomplete");
  const options = {
    types: ['locality', 'postal_code', 'point_of_interest'],
    componentRestrictions: { 'country': ['au', 'nz'] },
  };

  const autocomplete = new google.maps.places.Autocomplete(input, options);
  const originMarker = new google.maps.Marker({ map: map });
  originMarker.setVisible(false);
  let originLocation = map.getCenter();

  autocomplete.addListener('place_changed', async () => {
    originMarker.setVisible(false);
    const place = autocomplete.getPlace();

    if (!place.geometry) {
      alert('No address available for input: \'' + place.name + '\'');
      return;
    }

    originLocation = place.geometry.location;
    map.setCenter(originLocation);
    map.setZoom(9);

    originMarker.setPosition(originLocation);
    originMarker.setVisible(true);

    const rankedStores = await calculateDistances(map.data, originLocation);
    showStoresList(map.data, rankedStores);
  });

  async function calculateDistances(data, origin) {
    const stores = [];
    const originLatLng = new google.maps.LatLng(origin.lat(), origin.lng());

    data.forEach((store) => {
      const storeNum = store.getProperty('storeid');
      const storeLoc = store.getGeometry().get();

      const storeLatLng = new google.maps.LatLng(storeLoc.lat(), storeLoc.lng());
      const distanceInMeters = google.maps.geometry.spherical.computeDistanceBetween(originLatLng, storeLatLng);

      stores.push({
        storeid: storeNum,
        distanceText: `${(distanceInMeters / 1000).toFixed(2)} km`,
        distanceVal: distanceInMeters,
      });
    });

    stores.sort((a, b) => a.distanceVal - b.distanceVal);
    return stores;
  }

  function isStoreOpen(hoursHtml) {
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const now = new Date();
    const currentDay = daysOfWeek[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();
  
    // Use regex to find the hours for the current day
    const regex = new RegExp(`${currentDay}:\\s*(\\d{1,2}:\\d{2})\\s*([AP]M)\\s*–\\s*(\\d{1,2}:\\d{2})\\s*([AP]M)`);
    const match = hoursHtml.match(regex);
  
    if (!match) {
      return false;
    }
  
    const openingTime = convertToMinutes(match[1], match[2]);
    const closingTime = convertToMinutes(match[3], match[4]);
  
    // Determine if the current time is within the store hours
    return currentTime >= openingTime && currentTime <= closingTime;
  }
  
  function convertToMinutes(time, period) {
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = (period === 'PM' && hours !== 12 ? hours + 12 : hours) * 60 + minutes;
    if (period === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    return totalMinutes;
  }

  function animateMarker(marker) {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(() => marker.setAnimation(null), 1400);
  }

  function showStoresList(data, stores) {
    if (stores.length === 0) return;

    const storeList = document.getElementById('store-list');
    storeList.innerHTML = "";

    stores.slice(0, 10).forEach((store) => {
      const currentStore = data.getFeatureById(store.storeid);
      const name = currentStore.getProperty('name');
      const address = currentStore.getProperty('address');
      const phone = currentStore.getProperty('phone');
      const hours = currentStore.getProperty('hours');
      const position = currentStore.getGeometry().get();
      const distance = store.distanceText;
      const distanceVal = store.distanceVal;
      const close = currentStore.getProperty('close');
      const website = currentStore.getProperty('website');
      const openSoon = currentStore.getProperty('open_soon');
      
      if (distanceVal > 90000) {
        return;
      }


      const isOpen = isStoreOpen(hours);

      const listItem = document.createElement('div');
      listItem.className = 'list-item';
      listItem.dataset.storeid = store.storeid;
      listItem.dataset.sort = store.distanceVal;
      listItem.innerHTML = `
        <h6>${name} <span class="distance"><img src="https://cdn.shopify.com/s/files/1/0555/7508/5194/files/MapPin_1.png" width="8"> ${distance}</span></h6>
        <p>${address}</p>
        <p>${phone}</p>
        ${openSoon ? "<p class='open'>Soon to open</p>" : close ? "<p class='closed'>Closed</p>" : isOpen ? "<p class='open'>Open</p>" : "<p class='closed'>Closed</p>"}
        <a href="${website}" class="website-link" target="_blank">Visit Page</a>
        <a href="https://www.google.com/maps/search/?api=1&query=${position.lat()},${position.lng()}" class="direction" target="_blank">Get Directions</a>
      `;
       
      const content = `
        <div style="margin-bottom:20px;">
          <h6 style="text-transform:uppercase;">${name}</h6>
          <p>${address}</p>
          <p><b>Open:</b><br> ${hours}<br/><b>Phone:</b> ${phone}</p>
          <a href="${website}" class="website-link" target="_blank">Visit Page</a>
          <a href="https://www.google.com/maps/search/?api=1&query=${position.lat()},${position.lng()}" class="website-link" target="_blank">Get Directions</a>
        </div>
      `;
      
      listItem.addEventListener('click', () => {
        map.setCenter(position);
        infoWindow.setContent(content);
        infoWindow.setPosition(position);
        infoWindow.open(map);
      });

      storeList.appendChild(listItem);
    });
  }
}
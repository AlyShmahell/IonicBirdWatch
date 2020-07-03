$(document).ready(function () {
  var container = document.getElementById("popup");
  var content = document.getElementById("popup-content");
  var closer = document.getElementById("popup-closer");
  var center = [0, 0];
  var geolocation = navigator.geolocation;
  geolocation.getCurrentPosition((resp) => {
    center = [resp.coords.longitude, resp.coords.latitude];
    console.log("set coordinate", center);
  }, (error) => {
    console.log('Error getting location', error);
  });
  var view = new ol.View({
    center: ol.proj.fromLonLat(center),
    zoom: 8,
  });
  var geometry = new ol.geom.Point(ol.proj.fromLonLat(center));
  var overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
      duration: 250,
    },
  });
  closer.onclick = function () {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
  };
  var map = new ol.Map({
    target: "map",
    layers: [
      new ol.layer.Tile({
        source: new ol.source.OSM(),
      }),
    ],
    overlays: [overlay],
    view: view,
  });
  var iconFeature = new ol.Feature({
    geometry: geometry
  });
  var ivaryle = new ol.style.Style({
    image: new ol.style.Icon({
      src: 'static/img/marker.png'
    })
  });
  iconFeature.setStyle(ivaryle);
  var layer = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [iconFeature]
    })
  });
  map.addLayer(layer);
  geolocation.watchPosition((data) => {
    center = [data.coords.longitude, data.coords.latitude]
    console.log("changed coordinate", center);
    view.setCenter(ol.proj.fromLonLat(center));
    geometry.setCoordinates(ol.proj.fromLonLat(center));
  }, (error) => { console.log(error) });
  var search = new ol.control.Search({
    getTitle: function (f) {
      return f.name;
    },
  });
  map.addControl(search);
  $(".ol-attribution").hide();
  map.on("singleclick", function (evt) {
    var coordinate = evt.coordinate;
    var hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinate));
    content.innerHTML =
      "<p>You clicked here:</p><code>" + hdms + "</code>";
    overlay.setPosition(coordinate);
  });
  var r = $(
    '<button class="button"><i class="fas fa-align-justify"></i></button>'
  );
  $(".ol-zoom").append(r);
  var r = $(
    '<button class="button"><a class="button" href="/logout"><i class="far fa-sign-out"></i></a></button>'
  );
  $(".ol-zoom").prepend(r);
});
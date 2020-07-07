function add_point(map, center, icon) {
  var geometry = new ol.geom.Point(ol.proj.fromLonLat(center));
  var iconFeature = new ol.Feature({
    geometry: geometry
  });
  var ivaryle = new ol.style.Style({
    image: new ol.style.Icon({
      src: icon
    })
  });
  iconFeature.setStyle(ivaryle);
  var layer = new ol.layer.Vector({
    source: new ol.source.Vector({
      features: [iconFeature]
    })
  });
  map.addLayer(layer);
  return geometry;
}

function objectifyForm(formArray) {//serialize data function

  var returnArray = {};
  for (var i = 0; i < formArray.length; i++) {
    returnArray[formArray[i]['name']] = formArray[i]['value'];
  }
  return returnArray;
}

function calc_radius(map) {
  var size = map.getSize();
  var center = map.getView().getCenter();
  var sourceProj = map.getView().getProjection();
  var extent = map.getView().calculateExtent(size);
  extent = ol.proj.transformExtent(extent, sourceProj, 'EPSG:4326');
  var posSW = [extent[0], extent[1]];
  var posNE = [extent[2], extent[3]];
  center = ol.proj.transform(center, sourceProj, 'EPSG:4326');
  var centerToSW = ol.sphere.getDistance(center, posSW, radius = 6378137);
  var centerToNE = ol.sphere.getDistance(center, posNE, radius = 6378137);
  console.log("centerToSW - ", centerToSW);
  console.log("centerToNE - ", centerToNE);
  return [centerToNE, extent[0], extent[1]];
}

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
  var currZoom = map.getView().getZoom();
  map.on('moveend', function (e) {
    var newZoom = map.getView().getZoom();
    if (currZoom != newZoom) {
      console.log('zoom end, new zoom: ' + newZoom);
      currZoom = newZoom;
      calc_radius(map);
    }
  });
  var geometry = add_point(map, center, 'static/img/marker.png');
  calc_radius(map);
  geolocation.watchPosition((data) => {
    center = [data.coords.longitude, data.coords.latitude];
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


  daterange.noUiSlider.on("update", function (values, handle) {
    var key = "maxd";
    if (handle == 0) {
      key = "mind";
    }
    $("#" + key).remove();
    var r = $(
      '<input name="' +
      key +
      '" id="' +
      key +
      '" type="text" hidden/>'
    );
    $("#filters").append(r);
    $("#" + key).val(values[handle]);
  });
  $(".search").attr("form", "filters");
  $(".search").attr("name", "text");
  $(".search").on("keypress", function (e) {
    if (e.which == 13) {
      $("#filters").submit();
    }
  });
  $("#filters").on("submit", function (event) {
    event.preventDefault();
    var data = objectifyForm($("#filters").serializeArray());
    var radlonlat = calc_radius(map);
    data['area'] = radlonlat[0];
    data['lon'] = radlonlat[1];
    data['lat'] = radlonlat[2];
    var maxd = new Date();
    maxd.setMonth(maxd.getMonth() - data['mind']);
    var mind = new Date();
    mind.setMonth(mind.getMonth() - data['maxd']);
    data['maxd'] = maxd;
    data['mind'] = mind;
    data['xhr']  = true;
    data = JSON.stringify(data);
    $.ajax({
      url: "/guest",
      type: "get",
      data: {
        'data': data
      },
      success: function (response) {
        $(".list").html(response);
      },
      error: function (xhr) {
        //Do Something to handle error
      }
    })
  });
});
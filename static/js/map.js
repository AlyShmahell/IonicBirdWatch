markers = [];

function add_point(map, center, icon, pos) {

  for (var i = 0; i < center.length; i++) {
    center[i] = Number(center[i]),
      center[i] = center[i].toFixed(1);
  }
  var geometry = new ol.geom.Point(ol.proj.fromLonLat(center));
  var iconFeature = new ol.Feature({
    geometry: geometry,
    center: center.join('_').replace(/\./g, '_')
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
  if (!pos)
    markers.push(layer);
  map.addLayer(layer);
  return geometry;
}

function remove_points(map) {
  for (var i = 0; i < markers.length; i++) {
    map.removeLayer(markers[i]);
  }

}

function objectifyForm(formArray) {
  var returnArray = {};
  for (var i = 0; i < formArray.length; i++) {
    returnArray[formArray[i]['name']] = formArray[i]['value'];
  }
  return returnArray;
}


function refresh(map, url) {
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
  data['xhr'] = true;
  data = JSON.stringify(data);
  $.ajax({
    url: url,
    type: "get",
    data: {
      'data': data
    },
    success: function (response) {
      remove_points(map);
      $(".list").html(response);
      $(".add_marker").each(function () {
        add_point(map, JSON.parse(this.text), '/static/img/marker.png', false);
      });
    }
  })
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
  return [centerToNE, extent[0], extent[1]];
}


$(document).ready(function () {
  var url = $('#url').text().trim();
  var container = document.getElementById("popup");
  var content = document.getElementById("popup-content");
  var closer = document.getElementById("popup-closer");
  var center = [0, 0];
  var geolocation = navigator.geolocation;
  geolocation.getCurrentPosition((resp) => {
    center = [resp.coords.longitude, resp.coords.latitude];
  }, (error) => {
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
      currZoom = newZoom;
      calc_radius(map);
    }
  });
  var geometry = add_point(map, center, 'static/img/crosshairs.png', true);
  calc_radius(map);
  geolocation.watchPosition((data) => {
    center = [data.coords.longitude, data.coords.latitude];
    view.setCenter(ol.proj.fromLonLat(center));
    geometry.setCoordinates(ol.proj.fromLonLat(center));
    refresh(map, url);
  }, (error) => { });
  var search = new ol.control.Search({
    getTitle: function (f) {
      return f.name;
    },
  });
  map.addControl(search);
  $(".ol-attribution").hide();
  map.on("singleclick", function (evt) {
    var feature = map.forEachFeatureAtPixel(evt.pixel,
      function (feature) {
        return feature;
      });
    if (feature) {
      var coordinate = evt.coordinate;
      content.innerHTML = "<code></code>";
      if ($("#" + feature.get('center')).get(0) != undefined) {
        $("#" + feature.get('center')).get(0).scrollIntoView();
        $("#" + feature.get('center')).clone().appendTo($("#popup-content"));
        overlay.setPosition(coordinate);
      }
      else {
        overlay.setPosition(undefined);
        closer.blur();
      }
    }
  });
  var r = $(
    '<button class="button"><i class="fas fa-align-justify"></i></button>'
  );
  $(".ol-zoom").append(r);
  var r = $(
    '<button class="button"><a class="button" href="/logout"><i class="far fa-sign-out"></i></a></button>'
  );
  $(".ol-zoom").prepend(r);



  var daterange = $("#daterange")[0];
  noUiSlider.create(daterange, {
    start: [0, 100],
    tooltips: [wNumb({ decimals: 1 }), true],
    connect: true,
    range: {
      min: 0,
      max: 100,
    },
  });
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
  function log_modal_event(event, modal) {
    if (event.type == 'modal:close') {
      refresh(map, url);
    }
  };
  $(document).on($.modal.BEFORE_CLOSE, log_modal_event);
  $(document).on($.modal.CLOSE, log_modal_event);
  $(document).on($.modal.AFTER_CLOSE, log_modal_event);
  $("#filters").on("submit", function (event) {
    event.preventDefault();
    refresh(map, url);
  });
  $(".add_marker").each(function () {
    add_point(map, JSON.parse(this.text), '/static/img/marker.png', false);
  });
  $('#closereport').on('click',
    function () {
      refresh(map, url);
    }
  )
  $('#downloadall').click(function () {
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
    data['xhr'] = true;
    data = JSON.stringify(data);
    $.ajax({
      url: "/download",
      type: "get",
      data: {
        'data': data
      },
      xhrFields: {
        responseType: 'blob'
      },
      success: function (response) {
        console.log(response);
        var link = document.createElement('a');
        link.href = window.URL.createObjectURL(response);
        link.download = 'data.zip';
        link.click();
      }
    });
  })
  refresh(map, url);
});

function submit_report(event) {
  event.preventDefault();
  data = {
    'code': event.target.elements.code.value,
    'text': event.target.elements.text.value,
    'wildlifeid': event.target.elements.wildlifeid.value
  }
  $.ajax({
    url: "/report-submit",
    type: "post",
    data: data
  });
  $('#closereport').trigger('click');
}

function resolve_report(event) {
  event.preventDefault();
  data = {
    'cascade': event.target.elements.cascade.checked
  }
  var id = event.target.elements.id.value;
  $.ajax({
    url: "/report-resolve/" + id,
    type: "put",
    data: data
  });
  $('#closereport').trigger('click');
}

function remove_report(event) {
  event.preventDefault();
  data = {
    'cascade': event.target.elements.cascade.checked
  }
  var id = event.target.elements.id.value;
  $.ajax({
    url: "/report-remove/" + id,
    type: "delete",
    data: data
  });
  $('#closereport').trigger('click');
}
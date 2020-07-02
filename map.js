$(document).ready(function () {
    var container = document.getElementById("popup");
    var content = document.getElementById("popup-content");
    var closer = document.getElementById("popup-closer");
    var overlay = new ol.Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250,
      },
    });

    /*
     * Add a click handler to hide the popup.
     * @return {boolean} Don't follow the href.
     */
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
      view: new ol.View({
        center: ol.proj.fromLonLat([37.41, 8.82]),
        zoom: 4,
      }),
    });
    var search = new ol.control.Search({
      //target: $(".options").get(0),
      // Title to use in the list
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
});
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

    /**
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
    var collapsed = true;
    var r = $(
      '<button class="button"><i class="fas fa-align-justify"></i></button>'
    );
    $(".ol-zoom").append(r);
    if (screen.width <= 480) {
      $(".button").click(function () {
        {
          if (collapsed) {
            $(".nav").attr("style", "height:300px; margin-top:1vh;");
            collapsed = false;
          } else {
            $(".nav").attr("style", "height:0px; margin-top:0;");
            collapsed = true;
          }
        }
      });
    } else {
      $(".button").click(function () {
        {
          if (collapsed) {
            $(".nav").attr("style", "width:300px;margin-right:1vw;");
            collapsed = false;
          } else {
            $(".nav").attr("style", "width:0px;margin-right:0;");
            collapsed = true;
          }
        }
      });
    }
    var textWrapper = document.querySelector(".ml2");
    textWrapper.innerHTML = textWrapper.textContent.replace(
      /\S/g,
      "<span class='letter'>$&</span>"
    );

    anime
      .timeline({ loop: true })
      .add({
        targets: ".ml2 .letter",
        scale: [4, 1],
        opacity: [0, 1],
        translateZ: 0,
        easing: "easeOutExpo",
        duration: 950,
        delay: (el, i) => 70 * i,
      })
      .add({
        targets: ".ml2",
        opacity: 0,
        duration: 1000,
        easing: "easeOutExpo",
        delay: 10000,
      });
    var daterange = $("#daterange")[0];
    noUiSlider.create(daterange, {
      start: [20, 80],
      tooltips: [wNumb({ decimals: 1 }), true],
      connect: true,
      range: {
        min: 0,
        max: 100,
      },
    });
    daterange.noUiSlider.on("update", function (values, handle) {
      $("#daterange_n" + handle).remove();
      var r = $(
        '<input name="daterange_n' +
          handle +
          '" id="daterange_n' +
          handle +
          '" type="text" hidden/>'
      );
      $("#filters").append(r);
      $("#daterange_n" + handle).val(values[handle]);
    });
    $(".search").attr("form", "filters");
    $(".search").attr("name", "search");
    $(".search").on("keypress", function (e) {
      if (e.which == 13) {
        $("#filters").submit();
      }
    });
    $("#filters").on("submit", function (event) {
      event.preventDefault();
      console.log($("#filters").serialize());
    });
  });
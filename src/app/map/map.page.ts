import { AfterContentInit, Component, OnInit, ViewChild } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';

declare var ol: any;

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})
export class MapPage implements OnInit {
  constructor(private geolocation: Geolocation) { }

  map: any;

  ngOnInit() {
    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      const container = document.getElementById('popup');
      const content   = document.getElementById('popup-content');
      const closer    = document.getElementById('popup-closer');
      var overlay   = new ol.Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250000
        }
      });
      this.map = new ol.Map({
        target: 'map',
        overlays: [overlay],
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        view: new ol.View({
          center: ol.proj.fromLonLat([data.coords.longitude, data.coords.latitude]),
          zoom: 8
        })
      });
      var iconFeature = new ol.Feature({
        geometry: new ol.geom.Point(ol.proj.fromLonLat([data.coords.longitude, data.coords.latitude]))
      });
      var iconStyle = new ol.style.Style({
        image: new ol.style.Icon({
          src: 'assets/img/map_marker.png'
        })
      });
      iconFeature.setStyle(iconStyle);
      var layer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [iconFeature]
        })
      });
      this.map.addLayer(layer);
      this.map.on('click', function (evt: any) {
        var coordinate = evt.coordinate;
        var hdms = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinate));
        content.innerHTML = '<p>Current coordinates are :</p><code>' + hdms + '</code>';
        overlay.setPosition(coordinate);
        console.log(coordinate);
        return true;
      });
      closer.onclick = function () {
        closer.blur();
        return false;
      };
    });
  }
}
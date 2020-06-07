import { AfterContentInit, Component, OnInit, ViewChild } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import 'ol/ol.css';
import { Map, View, Overlay, Feature } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { Vector as LayerVector } from 'ol/layer';
import { Vector as SourceVector } from 'ol/source';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat } from 'ol/proj';
import { Style, Icon } from 'ol/style';
import { toStringHDMS } from 'ol/coordinate';
import Point from 'ol/geom/Point';
import { defaults as defaultInteractions, DragRotateAndZoom } from 'ol/interaction';


@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
})


export class MapPage implements OnInit {

  items = [];
  numTimesLeft = 5;

  constructor(private geolocation: Geolocation) {
    this.addMoreItems();
  }

  loadData(event) {
    setTimeout(() => {
      this.addMoreItems();
      this.numTimesLeft -= 1;
      event.target.complete();
    }, 2000);
  }

  addMoreItems() {
    for (let i=0; i<10; i++)
      this.items.push(i);
  }

  ngOnInit() {
    var center = [0, 0];
    this.geolocation.getCurrentPosition().then((resp) => {
      center = [resp.coords.longitude, resp.coords.latitude]
      console.log("set coordinate", center);
     }).catch((error) => {
       console.log('Error getting location', error);
     });
    var view = new View({
      center: fromLonLat(center),
      zoom: 8
    });
    var geometry = new Point(fromLonLat(center));
    var container = document.getElementById('popup');
    var closer   = document.getElementById('popup-closer');
    var content  = document.getElementById('popup-content');
    var overlay = new Overlay({
      element: container,
      autoPan: true,
      autoPanAnimation: {
        duration: 250000
      }
    });
    var map = new Map({
      interactions: defaultInteractions().extend([
        new DragRotateAndZoom()
      ]),
      target: document.getElementById('map'),
      overlays: [overlay],
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: view
    });
    var iconFeature = new Feature({
      geometry: geometry
    });
    var ivaryle = new Style({
      image: new Icon({
        src: 'assets/img/map_marker.png'
      })
    });
    iconFeature.setStyle(ivaryle);
    var layer = new LayerVector({
      source: new SourceVector({
        features: [iconFeature]
      })
    });
    map.addLayer(layer);
    map.on('click', function (evt: any) {
      var coordinate = evt.coordinate;
      var hdms = toStringHDMS(toLonLat(coordinate));
      content.innerHTML = '<p>clicked coordinates are :</p><code>' + hdms + '</code>';
      overlay.setPosition(coordinate);
      console.log(coordinate);
      return true;
    });
    closer.onclick = function () {
      overlay.setPosition(undefined);
      closer.blur();
      return false;
    };
    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      center = [data.coords.longitude, data.coords.latitude]
      console.log("changed coordinate", center);
      view.setCenter(fromLonLat(center))
      geometry.setCoordinates(fromLonLat(center))
    });
    setTimeout(() => {
      map.updateSize();
    }, 1);
  }
}
import { Component, OnInit, Input } from '@angular/core';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import 'ol/ol.css';
import { Map, View, Overlay, Feature } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { Vector as LayerVector } from 'ol/layer';
import { Vector as SourceVector } from 'ol/source';
import OSM from 'ol/source/OSM';
import { fromLonLat, toLonLat, transformExtent, transform } from 'ol/proj';
import { Style, Icon } from 'ol/style';
import Point from 'ol/geom/Point';
import { getDistance } from 'ol/sphere';
import { defaults as defaultInteractions, DragRotateAndZoom } from 'ol/interaction';
import { Injectable } from '@angular/core';
import { SQLiteProvider } from './sqlite.provider';
import { EventEmitterService } from './event.service';


@Component({
  selector: 'map',
  templateUrl: 'map.component.html',
  styleUrls: ['map.component.scss'],
})


@Injectable({
  providedIn: 'root'
})

export class fMapComponent implements OnInit {
  @Input() title: string = 'Drawer UI element';
  map: Map;
  view: View;
  geometry: Point;
  text: String = "";
  layers = [];
  center: [number, number];
  constructor(private geolocation: Geolocation, private db: SQLiteProvider, private ees: EventEmitterService) {
    var center = [0, 0];
    this.geolocation.getCurrentPosition({ enableHighAccuracy: false, maximumAge:Infinity }).then((resp) => {
      center = [resp.coords.longitude, resp.coords.latitude];
      this.view = new View({
        center: fromLonLat(center),
        zoom: 8
      });
      this.geometry = new Point(fromLonLat(center));
      var container = document.getElementById('ol-popup');
      var closer = document.getElementById('ol-popup-closer');
      var content = document.getElementById('ol-popup-content');
      var overlay = new Overlay({
        element: container,
        autoPan: true,
        autoPanAnimation: {
          duration: 250000
        }
      });
      this.map = new Map({
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
        view: this.view
      });
      document.querySelector('.ol-zoom').innerHTML = '';
      var iconFeature = new Feature({
        geometry: this.geometry
      });
      var ivaryle = new Style({
        image: new Icon({
          src: 'assets/img/crosshairs.png'
        })
      });
      iconFeature.setStyle(ivaryle);
      var layer = new LayerVector({
        source: new SourceVector({
          features: [iconFeature]
        })
      });
      this.map.addLayer(layer);
      this.map.on('click', async (evt: any) => {
        var coordinate = evt.coordinate;
        var lonlat = toLonLat(coordinate);
        var x = await this.db.dbInstance.executeSql(`SELECT * from wildlife WHERE ABS(lon-${lonlat[0]}) < 0.001 AND ABS(lat-${lonlat[1]}) < 0.001`);
        for (var i = 0; i < x.rows.length; i++) {
          var item = x.rows[i];
          content.innerHTML = `<ion-item>
                                    <ion-thumbnail slot="start">
                                      <img src="${item.photo}"/>
                                    </ion-thumbnail>
                                    <ion-label style="text-align: right">
                                      <h4 style="text-align: right">${ item.dist}</h4>
                                    </ion-label>
                                  </ion-item>
                                  <ion-item>
                                    <ion-label>
                                      <h2>${item.typ}</h2>
                                    </ion-label>
                                    <ion-label style="text-align: right">
                                      <h4 style="text-align: right">${ item.species}</h4>
                                    </ion-label>
                                  </ion-item>
                                  <ion-card-content>
                                    ${ item.notes}
                                  </ion-card-content>
                                </ion-card>
                              </ion-item>`;
          overlay.setPosition(coordinate);
        }
        return true;
      });
      closer.onclick = function () {
        overlay.setPosition(undefined);
        closer.blur();
        return false;
      };
      this.map.updateSize();
      (async () => {
        var maxd = new Date();
        maxd.setMonth(maxd.getMonth() - 0);
        var smaxd = maxd.toISOString();
        var mind = new Date();
        mind.setMonth(mind.getMonth() - 100);
        var smind = mind.toISOString();
        var textt = "";
        var typ = "[\'\']";
        var bywho = "anyone";
        var area = this.calc_radius();
        var query = `INSERT INTO filters(id, textt, maxd, mind, typ, bywho, lon, lat, area) VALUES (1, "${textt}", "${smaxd}", "${smind}", "${typ}", "${bywho}", ${center[0]}, ${center[1]}, ${area})`;
        var res = await this.db.dbInstance.executeSql(query);
      })();
    }).catch((error) => {
      console.log('Error getting location', error);
    });
    (async () => {
      var query = `SELECT * from filters where id=1`;
      var res = await this.db.dbInstance.executeSql(query);
      if (res.rows.length > 0) {
        if (typeof res.rows[0].textt === 'string' || res.rows[0].textt instanceof String) {
          this.text = res.rows[0].textt;
        }
      }
    })();

  }

  calc_radius() {
    var size = this.map.getSize();
    var center = this.map.getView().getCenter();
    var sourceProj = this.map.getView().getProjection();
    var extent = this.map.getView().calculateExtent(size);
    extent = transformExtent(extent, sourceProj, 'EPSG:4326');
    var posSW = [extent[0], extent[1]];
    var posNE = [extent[2], extent[3]];
    center = transform(center, sourceProj, 'EPSG:4326');
    var centerToSW = getDistance(center, posSW, 6378137);
    var centerToNE = getDistance(center, posNE, 6378137);
    return centerToNE;
  }
  ionViewDidEnter(){
  }
  ionViewWillEnter(){
  }
  ngOnInit() {
    (async()=>{
      this.populate();
    })();
    if (this.ees.subscribe == undefined) {
      this.ees.subscribe = this.ees.
        invoke.subscribe(async (name: string) => {
          await this.populate();
        });
    }
    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      var center = [data.coords.longitude, data.coords.latitude];
      this.view.setCenter(fromLonLat(center));
      this.geometry.setCoordinates(fromLonLat(center));
      (async () => {
        var query = `UPDATE filters SET lon=${center[0]}, lat=${center[1]} WHERE id=1`;
        await this.db.dbInstance.executeSql(query);
      })();
    });
  }

  async populate() {
    var query = `SELECT * from wildlife`;
    var x = await this.db.dbInstance.executeSql(query);    
    for (var i = 0; i < x.rows.length; ++i) {
      var y = x.rows[i];
      var geometry = new Point(fromLonLat([y.lon, y.lat]));
      var iconFeature = new Feature({
        geometry: geometry
      });
      var ivaryle = new Style({
        image: new Icon({
          src: 'assets/img/marker.png'
        })
      });
      iconFeature.setStyle(ivaryle);
      var layer = new LayerVector({
        source: new SourceVector({
          features: [iconFeature]
        })
      });
      this.map.addLayer(layer);
    }
  }

  async textInput(event) {
    event.preventDefault();
    this.text = event.target.value;
    var query = `UPDATE filters SET textt="${this.text}" WHERE id=1`;
    await this.db.dbInstance.executeSql(query);
  }

  async textClear(event) {
    event.preventDefault();
    this.text = "";
    var query = `UPDATE filters SET textt="${this.text}" WHERE id=1`;
    await this.db.dbInstance.executeSql(query);
  }
}
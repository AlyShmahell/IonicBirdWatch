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
  selector: 'fmap',
  templateUrl: 'fmap.component.html',
  styleUrls: ['fmap.component.scss'],
})


@Injectable({
  providedIn: 'root'
})

export class fMapComponent implements OnInit {
  @Input() title: string = 'Drawer UI element';
  map: Map;
  text: String = "";
  constructor(private geolocation: Geolocation, private db: SQLiteProvider, private ees: EventEmitterService) {
    (async () => {
      await this.db.seed('assets/sql/seed.sql');
    })();
    if (this.ees.subscribe == undefined) {
      this.ees.subscribe = this.ees.
        invoke.subscribe(async (name: string) => {
          await this.populate();
        });
    }
    (async () => {
      var query = `SELECT * from filters where id=1`;
      var res = await this.db.dbInstance.executeSql(query);
      if (typeof res.rows[0].textt === 'string' || res.rows[0].textt instanceof String){
        this.text = res.rows[0].textt;
      }
    })();

  }
  async update_filters_sql(center) {
    var query = `UPDATE filters SET lon=${center[0]}, lat=${center[1]} WHERE id=1`;
    await this.db.dbInstance.executeSql(query);

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
  ngOnInit() {
    var center = [0, 0];
    this.geolocation.getCurrentPosition().then((resp) => {
      center = [resp.coords.longitude, resp.coords.latitude];
    }).catch((error) => {
      console.log('Error getting location', error);
    });
    var view = new View({
      center: fromLonLat(center),
      zoom: 8
    });
    var geometry = new Point(fromLonLat(center));
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
      target: document.getElementById('fmap'),
      overlays: [overlay],
      layers: [
        new TileLayer({
          source: new OSM()
        })
      ],
      view: view
    });
    document.querySelector('.ol-zoom').innerHTML = '';
    var iconFeature = new Feature({
      geometry: geometry
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
                                  <ion-label>
                                    <h2>${item.typ}</h2>
                                  </ion-label>
                                  <ion-label>
                                    <h4>${ item.species}</h4>
                                  </ion-label>
                                  <ion-label>
                                    <h4>${ item.dist}</h4>
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
    setTimeout(async () => {
      this.map.updateSize();
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

    }, 10);

    let watch = this.geolocation.watchPosition();
    watch.subscribe((data) => {
      center = [data.coords.longitude, data.coords.latitude];
      view.setCenter(fromLonLat(center));
      geometry.setCoordinates(fromLonLat(center));
      this.update_filters_sql(center);
    });
  }
  async populate() {
    var query = `SELECT * from wildlife`;
    var x = await this.db.dbInstance.executeSql(query);
    for (var i = 0; i < x.rows.length; i++) {
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
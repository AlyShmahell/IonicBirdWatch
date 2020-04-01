import { AfterContentInit, Component, OnInit, ViewChild} from '@angular/core';
declare var ol: any;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  latitude: number = 18.5204;
  longitude: number = 73.8567;

  map: any;

  ngOnInit() {
    this.map = new ol.Map({
      target: 'map',
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View({
        center: ol.proj.fromLonLat([13.350985, 42.3689573]),
        zoom: 8
      })
    });

    var iconFeature = new ol.Feature({
      geometry: new ol.geom.Point(ol.proj.fromLonLat([13.350985, 42.3689573]))
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
  }
}
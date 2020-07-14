import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs-compat";
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { SQLiteProvider } from './sqlite.provider';
import axios from 'axios';
import { ToastController } from '@ionic/angular';
import { EventEmitterService } from './event.service';



interface Item {
  id: BigInteger;
  userid: BigInteger;
  type: string;
  species: string;
  notes: string;
  lon: BigInteger;
  lat: BigInteger;
  date: Date;
  photo: string;
}


function calc_distance(p1_lon, p1_lat, p2_lon, p2_lat) {
  var R = 6378137;
  var lat1 = p1_lat * Math.PI / 180;
  var lon1 = p1_lon * Math.PI / 180;
  var lat2 = p2_lat * Math.PI / 180;
  var lon2 = p2_lon * Math.PI / 180;
  var dlon = lon2 - lon1;
  var dlat = lat2 - lat1;
  var a = Math.pow(Math.sin(dlat / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dlon / 2), 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var dist = Math.round(R * c);
  if (dist > 1000) {
    return `${Math.round(dist / 1000)}km`;
  } else {
    return `${dist}m`;
  }
}


@Component({
  selector: 'inflist',
  templateUrl: 'inflist.component.html',
  styleUrls: ['inflist.component.scss'],
})

@Injectable({
  providedIn: 'root'
})
export class InfListComponent implements OnInit {
  @Input() url: string = '#';
  items = [];
  items$: Observable<Item[]>;
  filters: any;
  inflistdisabled = false;
  constructor(private http: HttpClient, private db: SQLiteProvider, public toastController: ToastController, private ees: EventEmitterService) { }
  ngOnInit() {
    this.ees.emit('inflist');
    this.requestdata();
  }
  requestdata() {
    const range = interval(1000);
    const piper = range.pipe(
      switchMap(() => this.db.dbInstance.executeSql(`SELECT * from filters`))
    );
    piper.subscribe(
      (x: any) => {
        var filters = x.rows[0]; 
        if (!_.isEqual(filters, this.filters)) {
          this.filters = filters;
          axios.get(
            `http://127.0.0.1:5001/auth/wildlife?text="${filters.textt}"&maxd=${filters.maxd}&mind=${filters.mind}&type=${filters.typ}&by=${filters.bywho}&lon=${filters.lon}&lat=${filters.lat}&area=${filters.area}`,
            {
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Authorization": `Bearer ${document.cookie}`,
                "X-Requested-With": "XMLHttpRequest",
                "Content-Type": "application/json"
              },
              withCredentials: true
            }
          ).then(
            async (resp) => {
              this.items = _.values(resp.data.data);
              for (var i = 0; i < this.items.length; i++) {
                this.items[i].dist = calc_distance(this.items[i].lon, this.items[i].lat, filters.lon, filters.lat);
              }
              for (var i = 0; i < this.items.length; i++) {
                try {
                  await this.db.dbInstance.executeSql(`INSERT INTO wildlife(id, userid, typ, species, notes, lon, lat, dist, datee, photo) VALUES (${this.items[i].id}, ${this.items[i].userid}, "${this.items[i].type}", "${this.items[i].species}", "${this.items[i].notes}", ${this.items[i].lon}, ${this.items[i].lat}, "${this.items[i].dist}", "${this.items[i].date}", "${this.items[i].photo}")`);
                } catch (e) {
                  console.log('sql error', e)
                }
              }
              this.ees.emit('inflist');
            }
          ).catch(
            async (err) => {
              await this.toast("not logged in", "red");
            }
          )
        }
      }
    );
  }
  async toast(message, color) {
    const toast = await this.toastController.create({
      message: message,
      color: color,
      duration: 2000
    });
    toast.present();
  }
  inflistload(event) {
    this.requestdata();
    event.target.complete();
  }
}
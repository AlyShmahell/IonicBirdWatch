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
  species: string;
  lat: BigInteger;
  date: Date;
  notes: string;
  type: BigInteger;
  lon: BigInteger;
  photo: string;
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
  constructor(private http: HttpClient, private db: SQLiteProvider, public toastController: ToastController, private  ees: EventEmitterService) { }
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
          console.log([filters, this.filters]);
          this.filters = filters;
          axios.get(
            `http://127.0.0.1:5001/auth/wildlife?text=%22%22&maxd=2020-12-29T08:15:27.243860Z&mind=2018-06-29T08:15:27.243860Z&type=[%22%22]&by=anyone&lon=${filters.lon}&lat=${filters.lat}&area=150`,
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
                try {
                  await this.db.dbInstance.executeSql(`INSERT INTO wildlife(id, userid, typ, species, notes, lon, lat, datee, photo) VALUES (${this.items[i].id}, ${this.items[i].userid}, "${this.items[i].type}", "${this.items[i].species}", "${this.items[i].notes}", ${this.items[i].lon}, ${this.items[i].lat}, "${this.items[i].date}", "${this.items[i].photo}")`);
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
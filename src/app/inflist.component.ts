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
  constructor(private http: HttpClient, private db: SQLiteProvider, public toastController: ToastController) { }
  ngOnInit() {
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
            (resp) => {
              console.log("resp", resp)
              this.items = _.values(resp.data.data);
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
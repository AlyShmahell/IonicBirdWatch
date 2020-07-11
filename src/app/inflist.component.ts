import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs-compat";
import { interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import * as _ from 'lodash';
import { SQLiteProvider } from './sqlite.provider';



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
  constructor(private http: HttpClient, private db: SQLiteProvider) { }
  ngOnInit() {
    this.requestdata();
  }
  requestdata() {
    const range = interval(1000);
    const piper = range.pipe(
      switchMap(() => this.db.dbInstance.executeSql(`SELECT * from map`))
    );
    piper.subscribe(
      (x: any)=> {
        var filters = x.rows[0];
        if (!_.isEqual(filters, this.filters))
        {
          console.log([filters, this.filters]);
          this.filters = filters;
          this.http
            .get<Item[]>(`http://127.0.0.1:5001/guest/wildlife?text=%22awesome%22&maxd=2018-06-29T08:15:27.243860Z&mind=2018-06-29T08:15:27.243860Z&type=[%22bird%22]&by=anyone&lon=${filters.c_lon}&lat=${filters.c_lat}&area=15`)
            .subscribe(data => {
              this.items = _.values(data['data']);
            },
              err => {
                console.log(err);
              });
        }
      }
    );
  }
  inflistload(event) {
    this.requestdata();
    event.target.complete();
  }
}
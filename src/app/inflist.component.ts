import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs-compat";
import { Injectable } from '@angular/core';
import * as _ from 'lodash';

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
  inflistdisabled = false;
  constructor(private http: HttpClient) { }
  ngOnInit() {
    this.requestdata();
  }
  requestdata() {
    console.log("inflist called");
    this.http
      .get<Item[]>('http://127.0.0.1:5000/guest/wildlife?text="awesome"&filters={"maxd": "2018-06-29 08:15:27.243860", "mind": "2018-06-29 08:15:27.243860", "type": ["bird"], "by": "me"}&location={"lon": 50, "lat": 50}&area=15')
      .subscribe(data => {
        console.log(data);
        this.items = _.values(data['data']);
        console.log(this.items);
      }, 
      err => {
        console.log(err);
      });
  }
  inflistload(event) {
    this.requestdata();
    event.target.complete();
  }
}
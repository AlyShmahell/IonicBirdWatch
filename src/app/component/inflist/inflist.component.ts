import { Component, Input, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs-compat";
import { map } from 'rxjs/operators';
import * as _ from 'lodash';

interface Item {
  userId: BigInteger;
  id: BigInteger;
  title: string;
  completed: boolean;
}

@Component({
  selector: 'inflist',
  templateUrl: 'inflist.component.html',
  styleUrls: ['inflist.component.scss'],
})


export class InfListComponent implements OnInit {
  @Input() url: string = '#';
  items = [];
  inflistdisabled = false;
  constructor(private http: HttpClient) { }
  ngOnInit() {
    this.requestdata();
  }
  requestdata() {
    console.log("inflist called");
    this.http
      .get<Item[]>("https://jsonplaceholder.typicode.com/todos/1")
      .pipe(
        map(response => {
          console.log("items");
          console.log(response);
          this.items = _.values(response);
          console.log(this.items);
        }));
  }
  inflistload(event) {
    this.requestdata();
    event.target.complete();
  }
}
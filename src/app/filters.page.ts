import { Component } from '@angular/core';
import { SQLiteProvider } from './sqlite.provider';
import * as _ from 'lodash';


@Component({
  selector: 'app-filters',
  templateUrl: './filters.page.html',
  styleUrls: ['./filters.page.scss'],
})


export class FiltersPage {
  filters: any;
  old: any;
  constructor(private db: SQLiteProvider) { 
    this.old = {
      'daterange': { 'lower': 0, 'upper': 100 },
      'by': "anyone",
      'types': []
    };
  }

  reset(event) {
    this.filters = {};
    for (var key in this.old){
      this.filters[key] = this.old[key]
    }
  }

  async recycle(event) {
    this.filters = this.old = {
      'daterange': { 'lower': 0, 'upper': 100 },
      'by': "anyone",
      'types': []
    };
    await this.submit(event);
  }

  async submit(event) {
    this.old = this.filters;
    var maxd = new Date();
    maxd.setMonth(maxd.getMonth() - this.filters.daterange.lower);
    var smaxd = maxd.toISOString();
    var mind = new Date();
    mind.setMonth(mind.getMonth() - this.filters.daterange.upper);
    var smind = mind.toISOString();
    var types = JSON.stringify(this.filters.types).replace(/\"/g, "'");
    await this.db.dbInstance.executeSql(`UPDATE filters SET mind="${smind}", maxd="${smaxd}", bywho="${this.filters.by}", typ="${types}" WHERE id=1`);
  }

  ngOnInit() {
    this.reset(null);
  }
}

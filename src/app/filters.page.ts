import { Component } from '@angular/core';
import { SQLiteProvider } from './sqlite.provider';
import * as _ from 'lodash';


function parseISOString(s) {
  var b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

function monthDiff(dateFrom, dateTo) {
  dateFrom = parseISOString(dateFrom);
  dateTo = parseISOString(dateTo);
  return dateTo.getMonth() - dateFrom.getMonth() +
    (12 * (dateTo.getFullYear() - dateFrom.getFullYear()))
}

@Component({
  selector: 'app-filters',
  templateUrl: './filters.page.html',
  styleUrls: ['./filters.page.scss'],
})


export class FiltersPage {
  filters: any;
  old: any;
  constructor(private db: SQLiteProvider) {
    this.filters = this.old = {
      'daterange': { 'lower': 0, 'upper': 100 },
      'by': "anyone",
      'types': []
    };
  }

  async reset(event) {
    var x = await this.db.dbInstance.executeSql(`SELECT * from filters where id=1`)
    if (x.rows.length === 1) {
      var now = new Date();
      var upper = monthDiff(now.toISOString(), x.rows[0].mind);
      var lower = monthDiff(now.toISOString(), x.rows[0].maxd);
      var types = JSON.parse(x.rows[0].typ.replace(/\'/g, "\""));
      if (types.length===1 && types[0]===""){
        types = [];
      }
      this.old = {
        'daterange': { 'lower': Math.abs(lower), 'upper': Math.abs(upper) },
        'by': x.rows[0].bywho,
        'types': types
      };
    }
    this.filters = {};
    for (var key in this.old) {
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

  async ngOnInit() {
    await this.reset(null);
  }
}

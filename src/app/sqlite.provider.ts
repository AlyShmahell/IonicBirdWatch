
import { Injectable } from '@angular/core';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { SQLiteInstance } from './sqlite.instance';
import { HttpClient } from "@angular/common/http";


declare var window: any;
const SQL_DB_NAME = '__broswer.db';
// const SQL_DB_NAME = process.env.IONIC_ENV === 'dev' ? '__broswer.db' : '__native.db';


@Injectable({
  providedIn: 'root'
})

export class SQLiteProvider {

  dbInstance: any;

  constructor(public sqlite: SQLite, private http: HttpClient) {
    this.init();
  }

  async init() {
    let isbrowser = document.URL.startsWith('http');
    if (isbrowser) {
      let db = window.openDatabase(SQL_DB_NAME, '1.0', 'DEV', 5 * 1024 * 1024);
      this.dbInstance = SQLiteInstance(db);
    } else {
      this.dbInstance = await this.sqlite.create({
        name: SQL_DB_NAME,
        location: 'default'
      });
    }
  }

  async seed(path) {
    await this.http.get(path, { responseType: 'text' })
      .subscribe(sql => {
        let sqlines = sql.split('\n');
        for (let i = 0; i < sqlines.length; i++) {
          this.dbInstance.executeSql(sqlines[i]);
        }
      });
    return true;
  }

}
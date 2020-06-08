import { Platform } from '@ionic/angular';
import { Injectable } from '@angular/core';
import { SQLitePorter } from '@ionic-native/sqlite-porter/ngx';
import { HttpClient } from '@angular/common/http';
import { SQLite, SQLiteObject } from '@ionic-native/sqlite/ngx';
import { BehaviorSubject, Observable } from 'rxjs';
 
export interface Item {
    id: BigInteger;
    userId: BigInteger;
    title: string;
    completed: boolean;
  }
 
@Injectable({
  providedIn: 'root'
})

export class DatabaseService {
  private database: SQLiteObject;
  private dbReady: BehaviorSubject<boolean> = new BehaviorSubject(false);
  items = new BehaviorSubject([]);
 
  constructor(private plt: Platform, private sqlitePorter: SQLitePorter, private sqlite: SQLite, private http: HttpClient) {
    this.plt.ready().then(() => {
      console.log("db 0");
      this.sqlite.create({
        name: 'database.db',
        location: 'default'
      })
      .then((db: SQLiteObject) => {
          console.log("db 1");
          this.database = db;
          this.seedDatabase();
      });
    });
  }
 
  seedDatabase() {
    this.http.get('assets/sql/seed.sql', { responseType: 'text'})
    .subscribe(sql => {
      this.sqlitePorter.importSqlToDb(this.database, sql)
        .then(_ => {
          this.loadItems();
          this.dbReady.next(true);
        })
        .catch(e => console.error(e));
    });
  }
 
  getDatabaseState() {
    return this.dbReady.asObservable();
  }
 
  getItems(): Observable<Item[]> {
    return this.items.asObservable();
  }

  loadItems() {
    return this.database.executeSql('SELECT * FROM items', []).then(data => {
      let items: Item[] = [];
 
      if (data.rows.length > 0) {
        for (var i = 0; i < data.rows.length; i++) {
 
          items.push({ 
            id: data.rows.item(i).id,
            userId: data.rows.item(i).userId, 
            title: data.rows.item(i).title, 
            completed: data.rows.item(i).completed
           });
        }
      }
      this.items.next(items);
    });
  }
 
  addItem(name, title, completed) {
    let data = [name, JSON.stringify(title), completed];
    return this.database.executeSql('INSERT INTO items (id, userId, title, completed) VALUES (?, ?, ?, ?)', data).then(data => {
      this.loadItems();
    });
  }
 
  getItem(id): Promise<Item> {
    return this.database.executeSql('SELECT * FROM items WHERE id = ?', [id]).then(data => {
 
      return {
        id: data.rows.item(0).id,
        userId: data.rows.item(0).userId, 
        title: data.rows.item(0).title, 
        completed: data.rows.item(0).completed
      }
    });
  }
 
  deleteItem(id) {
    return this.database.executeSql('DELETE FROM items WHERE id = ?', [id]).then(_ => {
      this.loadItems();
    });
  }
 
  updateItem(item: Item) {
    let data = [item.userId, item.title, item.completed];
    return this.database.executeSql(`UPDATE item SET name = ?, title = ?, completed = ? WHERE id = ${item.id}`, data).then(data => {
      this.loadItems();
    })
  }
}


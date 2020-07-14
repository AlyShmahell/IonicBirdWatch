import { Component } from '@angular/core';
import { SQLiteProvider } from './sqlite.provider';
import { EventEmitterService } from './event.service';

function pop(array: any) {
  const index = array.indexOf(5);
  if (index > -1) {
    array.splice(index, 1);
  }
  return array;
}

@Component({
  selector: 'app-filters',
  templateUrl: './filters.page.html',
  styleUrls: ['./filters.page.scss'],
})


export class FiltersPage {
  filters: any;
  constructor(private db: SQLiteProvider, private ees: EventEmitterService){}

  reset(event) {
    this.filters = {
      'daterange': {'lower': 0, 'upper': 100},
      'by': "anyone",
      'types': []
    };
  }
  async submit(event){
    var maxd = new Date();
    maxd.setMonth(maxd.getMonth() - this.filters.daterange.lower);
    var smaxd = maxd.toISOString();
    var mind = new Date();
    mind.setMonth(mind.getMonth() -  this.filters.daterange.upper);
    var smind = maxd.toISOString();
    await this.db.dbInstance.executeSql(`UPDATE filters SET mind="${smind}", maxd="${smaxd}", bywho="${this.filters.by}", typ="${this.filters.types}" WHERE id=1`);
  }

  ngOnInit() {
    this.reset(null);
    if (this.ees.subscribe == undefined) {
      this.ees.subscribe = this.ees.
        invoke.subscribe(async (name: string) => {
          await this.submit(undefined);
        });
    }
  }

}

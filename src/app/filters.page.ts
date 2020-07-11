import { Component } from '@angular/core';

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
  tags = [];
  tagChange(val){
    console.log(this.tags)
  }
  rangeChange(event) {
    console.log(event.detail.value.lower, event.detail.value.upper);
  }
  selectChange(event) {
    console.log(event.detail.value);
  }
  reset(event) {
    console.log(event);
    // commit to local db
  }
  ngOnInit() {

  }

}

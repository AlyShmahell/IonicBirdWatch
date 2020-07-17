import { Component, OnInit } from '@angular/core';
import { Location } from "@angular/common";

@Component({
  selector: 'app-licenses',
  templateUrl: './licenses.page.html',
  styleUrls: ['./licenses.page.scss'],
})
export class LicensesPage implements OnInit {

  constructor(private location: Location) { }

  ngOnInit() {
    
  }

  back(){
    this.location.back();
  }

}

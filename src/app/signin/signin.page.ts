import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {

  signin = {};

  constructor() { }

  ngOnInit() {
  }
  processForm(event){
    console.log(event);
    console.log(this.signin);
  }

}

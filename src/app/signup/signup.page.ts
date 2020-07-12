import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {
  signup = {};

  constructor() { }

  ngOnInit() {
  }
  processForm(event){
    console.log(event);
    console.log(this.signup);
  }
}

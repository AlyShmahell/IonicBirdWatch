import { Component, OnInit, Output, EventEmitter  } from '@angular/core';
import { Injectable } from '@angular/core';
import { AppMenu } from './amenu.component';


@Component({
  selector: 'app-toolbar',
  templateUrl: 'atoolbar.component.html',
  styleUrls: ['atoolbar.component.scss'],
})


@Injectable({
  providedIn: 'root'
})


export class AppToolBar implements OnInit {
  @Output() deteriorated = new EventEmitter<string>();
  constructor(private menu: AppMenu) {}
  ngOnInit() { }
  reset() { 
    this.deteriorated.next('deteriorated');
   }
   async openMenu() {
    await this.menu.openMenu();
  }
}
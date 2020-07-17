import { Component, OnInit, Input} from '@angular/core';
import { CupertinoPane } from 'cupertino-pane';
import { Injectable } from '@angular/core';

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.scss'],
})
 
@Injectable({
  providedIn: 'root'
})
export class DrawerComponent implements OnInit {
  drawer: CupertinoPane;
  @Input() selector: string = '';
  constructor() {}

  ngOnInit() {
    this.drawer = new CupertinoPane(this.selector, {
      buttonClose:false,
      breaks: {
        top: {
          enabled: true,
          height: window.screen.height / 1.1
        },
        middle: { 
          enabled: true,
          height: window.screen.height / 2
        },
        bottom: { 
          enabled: true,
          height: window.screen.height / 5
        }
      }
    });
    this.drawer.present();
  }
}
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { fMapComponent } from './map.component';

describe('fMapComponent', () => {
  let component: fMapComponent;
  let fixture: ComponentFixture<fMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ fMapComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(fMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

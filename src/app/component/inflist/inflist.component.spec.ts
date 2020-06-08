import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { InfListComponent } from './inflist.component';

describe('InfListComponent', () => {
  let component: InfListComponent;
  let fixture: ComponentFixture<InfListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InfListComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(InfListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

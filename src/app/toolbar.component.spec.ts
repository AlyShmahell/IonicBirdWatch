import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppToolBar } from './toolbar.component';

describe('AppToolBar', () => {
  let component: AppToolBar;
  let fixture: ComponentFixture<AppToolBar>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppToolBar ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AppToolBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

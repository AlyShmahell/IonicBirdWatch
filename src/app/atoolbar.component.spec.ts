import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppToolBar } from './atoolbar.component';

describe('AppToolBar', () => {
  let component: AppToolBar;
  let fixture: ComponentFixture<AppToolBar>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppToolBar ],
      imports: [IonicModule.forRoot(), HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AppToolBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

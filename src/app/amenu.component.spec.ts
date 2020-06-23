import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AppMenu } from './amenu.component';

describe('AppMenu', () => {
  let component: AppMenu;
  let fixture: ComponentFixture<AppMenu>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppMenu ],
      imports: [IonicModule.forRoot(), HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AppMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

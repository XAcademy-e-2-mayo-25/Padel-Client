import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterWithoutCourtsComponent } from './register-without-courts.component';

describe('RegisterWithoutCourtsComponent', () => {
  let component: RegisterWithoutCourtsComponent;
  let fixture: ComponentFixture<RegisterWithoutCourtsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterWithoutCourtsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterWithoutCourtsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

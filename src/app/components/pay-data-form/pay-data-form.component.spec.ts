import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayDataFormComponent } from './pay-data-form.component';

describe('PayDataFormComponent', () => {
  let component: PayDataFormComponent;
  let fixture: ComponentFixture<PayDataFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayDataFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayDataFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

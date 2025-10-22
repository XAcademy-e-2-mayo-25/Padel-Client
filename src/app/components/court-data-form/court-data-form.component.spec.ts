import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourtDataFormComponent } from './court-data-form.component';

describe('CourtDataFormComponent', () => {
  let component: CourtDataFormComponent;
  let fixture: ComponentFixture<CourtDataFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourtDataFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourtDataFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

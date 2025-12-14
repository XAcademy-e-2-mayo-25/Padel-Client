import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourtBookingComponent } from './court-booking.component';

describe('CourtBookingComponent', () => {
  let component: CourtBookingComponent;
  let fixture: ComponentFixture<CourtBookingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourtBookingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourtBookingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with Cancha 1 selected', () => {
    expect(component.selectedCourt).toBe('Cancha 1');
  });

  it('should have 4 courts available', () => {
    expect(component.courts.length).toBe(4);
  });

  it('should have calendar options configured', () => {
    const options = component.calendarOptions();
    expect(options.initialView).toBe('timeGridWeek');
    expect(options.slotMinTime).toBe('08:00:00');
    expect(options.slotMaxTime).toBe('22:00:00');
  });
});

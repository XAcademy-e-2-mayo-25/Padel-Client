import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerReservationsComponent } from './player-reservations.component';

describe('PlayerReservationsComponent', () => {
  let component: PlayerReservationsComponent;
  let fixture: ComponentFixture<PlayerReservationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerReservationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerReservationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

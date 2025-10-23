import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayerReservations } from './player-reservations';

describe('PlayerReservations', () => {
  let component: PlayerReservations;
  let fixture: ComponentFixture<PlayerReservations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerReservations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlayerReservations);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

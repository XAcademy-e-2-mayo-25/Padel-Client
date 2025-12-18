import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubReservas } from './club-reservas';

describe('ClubReservas', () => {
  let component: ClubReservas;
  let fixture: ComponentFixture<ClubReservas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubReservas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubReservas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

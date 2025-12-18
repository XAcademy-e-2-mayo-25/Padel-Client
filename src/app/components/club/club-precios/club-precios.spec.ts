import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubPrecios } from './club-precios';

describe('ClubPrecios', () => {
  let component: ClubPrecios;
  let fixture: ComponentFixture<ClubPrecios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubPrecios]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubPrecios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubCanchas } from './club-canchas';

describe('ClubCanchas', () => {
  let component: ClubCanchas;
  let fixture: ComponentFixture<ClubCanchas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubCanchas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubCanchas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

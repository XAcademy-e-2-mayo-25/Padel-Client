import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClubProfile } from './club-profile';

describe('ClubProfile', () => {
  let component: ClubProfile;
  let fixture: ComponentFixture<ClubProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClubProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClubProfile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

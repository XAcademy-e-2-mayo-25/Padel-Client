import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FindMatches } from './find-matches';

describe('FindMatches', () => {
  let component: FindMatches;
  let fixture: ComponentFixture<FindMatches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FindMatches]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FindMatches);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClubStatistics } from './club-statistics';
describe('ClubStatistics', () => {
  let component: ClubStatistics;
  let fixture: ComponentFixture<ClubStatistics>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ClubStatistics] }).compileComponents();
    fixture = TestBed.createComponent(ClubStatistics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportPlayer } from './support-player';

describe('SupportPlayer', () => {
  let component: SupportPlayer;
  let fixture: ComponentFixture<SupportPlayer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportPlayer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportPlayer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

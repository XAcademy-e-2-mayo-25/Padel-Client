import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupportPlayerComponent } from './support-player.component';

describe('SupportPlayerComponent', () => {
  let component: SupportPlayerComponent;
  let fixture: ComponentFixture<SupportPlayerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupportPlayerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupportPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

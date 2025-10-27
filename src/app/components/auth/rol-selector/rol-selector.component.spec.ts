import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RolSelectorComponent } from './rol-selector.component';

describe('RolSelectorComponent', () => {
  let component: RolSelectorComponent;
  let fixture: ComponentFixture<RolSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RolSelectorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RolSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

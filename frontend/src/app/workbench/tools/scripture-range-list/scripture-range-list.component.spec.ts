import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptureRangeListComponent } from './scripture-range-list.component';

describe('ScriptureRangeListComponent', () => {
  let component: ScriptureRangeListComponent;
  let fixture: ComponentFixture<ScriptureRangeListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScriptureRangeListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScriptureRangeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

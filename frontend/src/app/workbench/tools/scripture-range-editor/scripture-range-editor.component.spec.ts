import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptureRangeEditorComponent } from './scripture-range-editor.component';

describe('ScriptureRangeEditorComponent', () => {
  let component: ScriptureRangeEditorComponent;
  let fixture: ComponentFixture<ScriptureRangeEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScriptureRangeEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScriptureRangeEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

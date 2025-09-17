import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditScriptureRangeContextMenuComponent } from '../interfaces/edit-scripture-range-context-menu.component';

describe('EditScriptureRangeContextMenuComponent', () => {
  let component: EditScriptureRangeContextMenuComponent;
  let fixture: ComponentFixture<EditScriptureRangeContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditScriptureRangeContextMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditScriptureRangeContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

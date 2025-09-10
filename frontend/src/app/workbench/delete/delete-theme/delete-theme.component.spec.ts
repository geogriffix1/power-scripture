import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteThemeComponent } from './delete-theme.component';

describe('EditThemeComponent', () => {
  let component: DeleteThemeComponent;
  let fixture: ComponentFixture<DeleteThemeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteThemeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeleteThemeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

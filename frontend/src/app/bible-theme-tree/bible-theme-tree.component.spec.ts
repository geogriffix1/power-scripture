import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BibleThemeTreeComponent } from './bible-theme-tree.component';

describe('BibleThemeTreeComponent', () => {
  let component: BibleThemeTreeComponent;
  let fixture: ComponentFixture<BibleThemeTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BibleThemeTreeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BibleThemeTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

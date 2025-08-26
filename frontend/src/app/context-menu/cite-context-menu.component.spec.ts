import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CiteContextMenuComponent } from './cite-context-menu.component';

describe('CiteContextMenuComponent', () => {
  let component: CiteContextMenuComponent;
  let fixture: ComponentFixture<CiteContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CiteContextMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CiteContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchContextMenuComponent } from './search-context-menu.component';

describe('SearchContextMenuComponent', () => {
  let component: SearchContextMenuComponent;
  let fixture: ComponentFixture<SearchContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchContextMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

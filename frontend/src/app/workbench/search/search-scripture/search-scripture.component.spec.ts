import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchScriptureComponent } from './search-scripture.component';

describe('SearchScriptureComponent', () => {
  let component: SearchScriptureComponent;
  let fixture: ComponentFixture<SearchScriptureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchScriptureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchScriptureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

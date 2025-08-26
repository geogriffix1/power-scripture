import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchScriptureReportComponent } from './search-scripture-report.component';

describe('SearchScriptureReportComponent', () => {
  let component: SearchScriptureReportComponent;
  let fixture: ComponentFixture<SearchScriptureReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchScriptureReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SearchScriptureReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

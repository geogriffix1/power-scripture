import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CiteScriptureReportComponent } from './cite-scripture-report.component';

describe('CiteScriptureReportComponent', () => {
  let component: CiteScriptureReportComponent;
  let fixture: ComponentFixture<CiteScriptureReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CiteScriptureReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CiteScriptureReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

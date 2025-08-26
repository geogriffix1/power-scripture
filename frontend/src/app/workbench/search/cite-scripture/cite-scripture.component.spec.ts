import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CiteScriptureComponent } from './cite-scripture.component';

describe('CiteScriptureComponent', () => {
  let component: CiteScriptureComponent;
  let fixture: ComponentFixture<CiteScriptureComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CiteScriptureComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CiteScriptureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

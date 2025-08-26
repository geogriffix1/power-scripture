import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThemeNodeComponent } from './theme-node.component';

describe('ThemeNodeComponent', () => {
  let component: ThemeNodeComponent;
  let fixture: ComponentFixture<ThemeNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemeNodeComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThemeNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCitationContextMenuComponent } from './create-citation-context-menu.component';

describe('CreateCitationContextMenuComponent', () => {
  let component: CreateCitationContextMenuComponent;
  let fixture: ComponentFixture<CreateCitationContextMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCitationContextMenuComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateCitationContextMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

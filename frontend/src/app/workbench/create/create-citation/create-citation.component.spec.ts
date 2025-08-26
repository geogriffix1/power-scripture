import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCitationComponent } from './create-citation.component';

describe('CreateCitationComponent', () => {
  let component: CreateCitationComponent;
  let fixture: ComponentFixture<CreateCitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCitationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateCitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

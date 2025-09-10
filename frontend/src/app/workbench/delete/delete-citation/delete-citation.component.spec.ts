import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteCitationComponent } from './delete-citation.component';

describe('DeleteCitationComponent', () => {
  let component: DeleteCitationComponent;
  let fixture: ComponentFixture<DeleteCitationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteCitationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DeleteCitationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

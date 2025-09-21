import { Component } from '@angular/core';
import { AccordionModule } from 'ngx-bootstrap/accordion';

@Component({
  selector: 'app-accordion',
  standalone: true,
  imports: [AccordionModule],
  template: `
    <accordion [isAnimated] = true>
      @for (item of items; track item.title) {
        <accordion-group
         [heading] = "item.title",
         [isOpen] = "item.isOpen",
         (isOpenChange) = "toggle(item.id)">
          {{ item.content }}
        </accordion-group>
      }
    </accordion>
  `
})
export class AccordionComponent {
  items = [
    { id:1, title: 'Section 1', content: 'Content for section 1', isOpen: false },
    { id:2, title: 'Section 2', content: 'Content for section 2' , isOpen: false },
    { id:3, title: 'Section 3', content: 'Content for section 3', isOpen: false }
  ];

  toggle(id:number) {
    this.items = this.items.map(item => item.id === id ? { ...item, isOpen: !item.isOpen } : item);
  }
}

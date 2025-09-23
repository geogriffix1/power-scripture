import { Component, Input } from '@angular/core';
interface AccordionItem {
  title: string;
  content: string;
}

@Component({
  selector: 'app-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.css']
})
export class DummyComponent {
  accordionItems: AccordionItem[] = [];

  ngOnInit(): void {
    this.loadAccordionItems();
  }

  private loadAccordionItems(): void {
    this.accordionItems = [
      {
        title: 'First Accordion Item',
        content: 'This is the content for the first accordion item. It can contain any HTML content as needed.',
      },
      {
        title: 'Second Item',
        content: 'Content for the second item goes here. You can add lists, images, or other components.',
      },
      {
        title: 'Third Accordion Panel',
        content: 'The third item has different content. In a real application, this might be loaded from an API.',
      },
      {
        title: 'Fourth Item',
        content: 'More example content for the accordion component. The number of items is dynamic.',
      },
    ];
  }
}

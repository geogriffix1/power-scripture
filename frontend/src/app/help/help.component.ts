import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

type HelpPage =
  | 'definitions'
  | 'search'
  | 'create'
  | 'edit'
  | 'delete'
  | 'import'
  | 'publish'
  | 'help';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrl: './help.component.css'
})
export class HelpComponent implements OnInit {
  private route = inject(ActivatedRoute);

  activePage: HelpPage = 'definitions';

  ngOnInit(): void {
    const page = this.route.snapshot.queryParamMap.get('page') as HelpPage | null;
    if (page) {
      this.activePage = page;
    }
  }

  setPage(page: HelpPage): void {
    this.activePage = page;
  }
}
import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { AppComponent } from '../app.component';
import { BibleThemeTreeComponent } from '../bible-theme-tree/bible-theme-tree.component';
import { CiteScriptureRangeModel } from '../model/citeScriptureRangeModel';
import { JstreeModel } from '../model/jstree.model';

@Component({
  selector: 'app-workbench',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './workbench.component.html',
  styleUrl: './workbench.component.css'
})
export class WorkbenchComponent {
  static activeCitation:JstreeModel;
  static activeTheme:JstreeModel;
  static scriptureRanges: CiteScriptureRangeModel[];
  static WorkbenchResizeBroadcaster:Subject<DOMRectReadOnly>;
  static getWorkbenchSize() {
    let section = $("section.bible-workbench");
    let position = section.position();

    let rect = new DOMRect(position?.left ?? 0, position?.top ?? 0, section.innerWidth(), section.innerHeight());
    return rect;
  }

  onSearchClick() {
    this.router.navigate(['search']);
  }

  onCreateClick() {
    this.router.navigate(['create']);
  }

  onEditClick() {
    AppComponent.editObject = undefined;
    this.router.navigate(['edit']);
  }

  onDeleteClick() {
    console.log("onDeleteClick");
    AppComponent.editObject = undefined;
    this.router.navigate(['delete']);
  }

  resizeObserver = new ResizeObserver(elements => {
    let element = elements[0];
      WorkbenchComponent.WorkbenchResizeBroadcaster.next(element.contentRect);
  });

  ngAfterViewInit() {
    WorkbenchComponent.WorkbenchResizeBroadcaster = new Subject<DOMRectReadOnly>;
    this.resizeObserver.observe($("section.bible-workbench")[0]);

    BibleThemeTreeComponent.ActiveCitationSelector.subscribe((citation:JstreeModel) => {
      WorkbenchComponent.activeCitation = citation;
    });

    BibleThemeTreeComponent.ActiveThemeSelector.subscribe((theme:JstreeModel) => {
      WorkbenchComponent.activeTheme = theme;
    });
  }

  ngOnDestroy() {
    BibleThemeTreeComponent.ActiveCitationSelector.unsubscribe();
    BibleThemeTreeComponent.ActiveThemeSelector.unsubscribe();
  }

  constructor(private router:Router) {}
}
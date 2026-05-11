import { Component, Input } from '@angular/core';
import { Packer } from 'docx';
import { saveAs } from 'file-saver';

import { DocumentCreator } from './search-scripture-report-generator';
import { ScriptureModel } from '../../model/scripture.model';
import { ScriptureRangeModel } from '../../model/scriptureRange.model';

@Component({
    selector: 'app-search-scripture-report',
    imports: [],
    templateUrl: './search-scripture-report.component.html',
    styleUrl: './search-scripture-report.component.css'
})
export class SearchScriptureReportComponent {
  @Input()
    SearchCommand!: string;
  //@Input()
  //  ScriptureList!: ScriptureModel[];
  @Input()
    Context!: any;

  ngOnInit() {
    const creator = new DocumentCreator();
    const doc = creator.create(this.SearchCommand, this.Context.searchResults);

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "Power Scripture search report.docx");
      this.Context.showSearchScriptureReport = false;
    });
  }
}

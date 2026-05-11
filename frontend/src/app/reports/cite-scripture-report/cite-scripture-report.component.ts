import { Component, Input } from '@angular/core';
import { Packer } from 'docx';
import { saveAs } from 'file-saver';
import { CitationDocumentCreator } from './cite-scripture-report-generator';
import { CiteScriptureRangeModel } from '../../model/citeScriptureRangeModel';

@Component({
    selector: 'app-cite-scripture-report',
    imports: [],
    templateUrl: './cite-scripture-report.component.html',
    styleUrl: './cite-scripture-report.component.css'
})
export class CiteScriptureReportComponent {
  @Input()
    Context!: any;

  ngOnInit() {
    const creator = new CitationDocumentCreator;
    const doc = creator.create(this.Context.citations);

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, `Power Scripture citation report.docx`);

      this.Context.showCiteScriptureReport = false;
    });
  }
}

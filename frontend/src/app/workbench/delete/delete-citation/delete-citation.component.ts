import { Component } from '@angular/core';
import { JstreeModel } from '../../../model/jstree.model';

@Component({
  selector: 'app-delete-citation',
  standalone: true,
  imports: [],
  templateUrl: './delete-citation.component.html',
  styleUrl: './delete-citation.component.css'
})
export class DeleteCitationComponent {
  activeCitation?: JstreeModel;
}

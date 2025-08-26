import { Component } from '@angular/core';
import { JstreeModel } from '../../../model/jstree.model';

@Component({
  selector: 'app-edit-citation',
  standalone: true,
  imports: [],
  templateUrl: './edit-citation.component.html',
  styleUrl: './edit-citation.component.css'
})
export class EditCitationComponent {
activeCitation?: JstreeModel;
}

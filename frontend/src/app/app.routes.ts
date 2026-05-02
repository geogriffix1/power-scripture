import { Routes } from '@angular/router';
import { MainShellComponent } from './mainshell/mainshell.component';
import { WorkbenchComponent } from './workbench/workbench.component';
import { SearchComponent } from './workbench/search/search.component';
import { CreateComponent } from './workbench/create/create.component';
import { EditComponent } from './workbench/edit/edit.component';
import { DeleteComponent } from './workbench/delete/delete.component';
import { ImportComponent } from './workbench/import/import.component';
import { HelpComponent } from './help/help.component';

export const routes: Routes = [
  {
    path: '',
    component: MainShellComponent,
    children: [
      {
        path: '',
        component: WorkbenchComponent,
        children: [
          { path: '', redirectTo: 'search', pathMatch: 'full', data: { activeTool: 'search' } },
          { path: 'search', component: SearchComponent, data: { activeTool: 'search' } },
          { path: 'create', component: CreateComponent, data: { activeTool: 'create' } },
          { path: 'create/citation', component: CreateComponent, data: { activeTool: 'create' } },
          { path: 'create/theme', component: CreateComponent, data: { activeTool: 'create' } },
          { path: 'edit', component: EditComponent, data: { activeTool: 'edit' } },
          { path: 'edit/theme', component: EditComponent, data: { activeTool: 'edit' } },
          { path: 'edit/citation', component: EditComponent, data: { activeTool: 'edit' } },
          { path: 'edit/citation/range', component: EditComponent, data: { activeTool: 'edit' } },
          { path: 'edit/citation/verse', component: EditComponent, data: { activeTool: 'edit' } },
          { path: 'edit/citation/verse/markup', component: EditComponent, data: { activeTool: 'edit' } },
          { path: 'delete', component: DeleteComponent, data: { activeTool: 'delete' } },
          { path: 'delete/citation', component: DeleteComponent, data: { activeTool: 'delete' } },
          { path: 'delete/theme', component: DeleteComponent, data: { activeTool: 'delete' } },
          { path: 'import', component: ImportComponent, data: { activeTool: '' } }
        ]
      }
    ]
  },
  { path: 'help', component: HelpComponent },
  { path: '**', redirectTo: '' }
];
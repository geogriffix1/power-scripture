import { Routes } from '@angular/router';
import { SearchComponent } from './workbench/search/search.component';
import { CreateComponent } from './workbench/create/create.component';
import { EditComponent } from './workbench/edit/edit.component';
import { DeleteComponent } from './workbench/delete/delete.component';
import { ImportComponent } from './workbench/import/import.component';

export const routes: Routes = [
    { path: 'search', component: SearchComponent },
    { path: 'create', component: CreateComponent },
    { path: 'create/citation', component: CreateComponent },
    { path: 'create/theme', component: CreateComponent },
    { path: 'edit', component: EditComponent },
    { path: 'edit/theme', component: EditComponent },
    { path: 'edit/citation', component: EditComponent },
    { path: 'edit/citation/range', component: EditComponent },
    { path: 'edit/citation/verse', component: EditComponent },
    { path: 'edit/citation/verse/markup', component: EditComponent },
    { path: 'delete', component: DeleteComponent },
    { path: 'delete/citation', component: DeleteComponent },
    { path: 'delete/theme', component: DeleteComponent },
    { path: 'import', component: ImportComponent },
    { path: '**', redirectTo: '/search' }
];

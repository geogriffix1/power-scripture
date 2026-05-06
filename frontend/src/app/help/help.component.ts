import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HelpTopic } from '../model/help-topic.model';

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
export class HelpComponent {
  topics = HELP_TOPICS;
  activeTopic = HELP_TOPICS[0];

  selectTopic(topic: typeof HELP_TOPICS[number]): void {
    this.activeTopic = topic;
  }

  closeHelp(): void {
    window.close();
  }
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: 'overview',
    title: 'Overview',
    iconClass: 'ps-icon ps-icon-help-book',
    content: `
      <h2>Welcome to Power Scripture</h2>
      <p>Power Scripture is a <b>free</b> and powerful tool for searching scripture by
      text and organizing biblical content in a structured manner.
      Those of us who love the Bible but who struggle to find narratives or verses whenever
      needed will find this tool useful.</p>

      <p>Power Scripture provides a structured way to organize scripture into themes.
      Themes are nested into a logical pathway of sub-themes. Collections of specific verses are organized
      into citations. Themes and citations are recorded in a database
      and presented in a navigable tree structure.</p>

      <p>Don't flip through paper pages of Bible notes. Save your verses as you read and
      retrieve them when you need them.</p>

      <p>Power Scripture is built on the principle that the Bible is more than a book to be read.
      It is a tool to be used, a resource to be mined, and a treasure to be
      explored and organized. May God bless you in the study of His Holy Word.</p>
    `
  },
  {
    id: 'theme-tree',
    title: 'Bible Theme Tree',
    iconClass: 'ps-icon ps-icon-tree',
    content: `
      <h2>Bible Theme Tree</h2>
      <p>Power Scripture is presented in a split-view layout. The left pane contains the Bible Theme Tree.
      The right pane contains the Workbench.</p>

      <p>The Bible Theme Tree is used to browse, select, and organize themes and citations.</p>

      <p>The Theme Tree is primarily a navigation and command surface. Detailed editing is performed in the Workbench.</p>

      <p>Right-clicking a node of the tree will display a context menu with available functions.
      Themes are presented with a folder icon <i class="ps-icon ps-icon-folder"></i>. Citations
      are presented as a script icon <i class="ps-icon ps-icon-script"></i>.</p>

      <p>Themes are containers for other themes and for citations. Themes that contain subthemes or citations
      can be opened to reveal their contents. Themes can be created, edited,
      or deleted. Deleting a theme will also delete all of the themes and citations it contains. Two themes
      with the same parent cannot have the same name. Themes also have descriptions. Descriptions are optional.
      Descriptions appear as a tooltip when hovering over a theme node on the tree.</p>

      <p>Citations are collections of scripture verses. Citations can be created, edited, or deleted.
      Citations do not have names, they are labeled with the verses they contain. Citations can have 
      descriptions. Descriptions are optional. They appear as a tooltip when hovering over a citation node
      on the theme tree.</p>

      <p>Clicking a theme or citation activates it. Only one theme and one citation can be active at a time.
      Activating a theme or citation will make it accessible to the workbench. Right-clicking a
      theme or citation causes a context menu to appear with options.</p>

      <p>Themes and citations can be copied and pasted onto another theme. Theme names and descriptions can be edited.
      The order of subthemes and citations contained in a theme can be rearranged in the workbench. Citations can be
      edited in the workbench or deleted. Pasting a citation onto a theme will cause the same citation to be referenced
      from more than one theme. Editing the citation will affect all themes that reference that citation. Deleting a
      citation that is referenced by multiple themes will only remove the association between the selected theme and the citation.</p>

      <p>Top-level themes cannot be renamed or deleted. The member themes and citations can be rearranged in
      the workbench editor.</p>
    `
  },
  {
    id: 'workbench',
    title: 'Workbench',
    iconClass: 'ps-icon ps-icon-workbench',
    content: `
      <h2>Workbench</h2>
      <p>The workbench is the right pane of the Power Scripture application. It is used to
      perform most of the actions of the application. The workbench has a toolbar with buttons
      for the various actions supported by the application.</p>

      <p>The Workbench is organized by action: search, create, edit, delete, import, and publish. Some
      features are not yet implemented. Invoke actions by clicking toolbar buttons or using the Bible
      Theme Tree context menu.</p>

      <h3>Search</h3>
      <p>The magnifying glass button <i class="ps-icon ps-icon-search"></i> opens the search tool.
      The search engine allows scripture searches for verses by text content. Wildcards and
      regular expressions can be used to enhance the search. Search results can be selected and
      saved as citations.</p>

      <h3>Create</h3>
      <p>The create button <i class="ps-icon ps-icon-create"></i> opens the create tool. The create tool
      allows for creation of themes and citations under the active theme.</p>

      <h3>Edit</h3>
      <p>The edit button <i class="ps-icon ps-icon-edit"></i> opens the edit tool. The edit tool allows for editing
      the active theme or citation. Themes can be renamed and given descriptions. Citations
      can have their descriptions and verse ranges edited. Individual verses can be "marked up" by
      use of the markup editor.</p>

      <h3>Delete</h3>
      <p>The delete button <i class="ps-icon ps-icon-delete"></i> opens the delete tool. The delete tool allows
      deletion of the active theme or citation. Deleting a theme will also delete all of the themes and
      citations it contains. Deleting a citation will only delete the reference to the citation if more than one
      reference exists.</p>

      <h3>Import</h3>
      <p>The import button <i class="ps-icon ps-icon-import"></i> opens the import tool. The import tool provides
      an input console for creating themes and citations by keyboard entry. The tool allows navigation along
      the theme tree opening themes for the purpose of creating themes and citations as children of the opened
      theme. There is an undo and redo feature. Changes can be saved in bulk or rolled back.
      Future expansion will allow for the import of archived themes.</p>

      <h3>Publish</h3>
      <p>The publish button <i class="ps-icon ps-icon-scenario"></i> is not yet implemented. It will allow report
      generation for themes and citations, and the export of Power Scripture themes for archive or import into
      another Power Scripture installation.</p>

      <h3>Help</h3>
      <p>The Help button <i class="ps-icon ps-icon-help"></i> Opens the help page you are currently viewing.</p>
    `
  }
];
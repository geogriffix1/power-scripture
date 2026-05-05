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
      <p>Power Scripture is <b>free</b> and powerful tool for searching scripture by
      text and organizing biblical content in a structured manner.
      Those of us who love the Bible but who struggle to find the narratives
      or verses we need whenever we need them will love this tool.</p>

      <p>Power Scripture allows one to organizes collections of Bible verses into themes.
      Themes are nested into a logical pathway of sub-themes. Collections of specific verses are organized
      into biblical citations. Themes and citations are recorded in a database
      and presented in a navigable tree structure.</b>

      <p>Don't flip through paper pages of Bible notes. Save your verses as you read and
      retrieve them when you need them.</p>

      <p>Power Scripture is built on the principle that the Bible is more than a book to be read.
      It is a tool to be used. It is a resource to be mined. It is a treasure to be
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
      The right pain contains the Workbench.</p>

      <p>The Bible Theme Tree is used to browse, select, and organize themes and citations.</p>
      <p>Right-clicking a node of the tree will display a context menu with available funtions.
      Themes are presented with a folder icon <i class="ps-icon ps-icon-folder"></i>. Citations
      are presented as a script icon <i class="ps-icon ps-icon-script"></i></div>.</p>

      Themes are containers for other themes and for citations. Themes which have member themes or
      citations can be opened to reveal the themes and citations they contain. Themes can be created, edited,
      or deleted. Deleting a theme will also delete all of the themes and citations it contains. Two themes
      with the same parent cannot have the same name. Themes also have descriptions. Descriptions are optional.
      Descriptions appear as a tooltip when hovering over a theme node on the tree.</p>

      <p>Citations are collections of scripture verses. Citations can be created, edited, or deleted.
      Citations do not have names, they are labeled with the verses they contain. Citation can have 
      descriptions. Descriptinons are optional. They appear as a tooltip when hovering over a citation node
      on the theme tree.</p>

      <p>Clicking a theme or citation activates it. Only one theme and one citation can be active at any
      given time. Activating a theme or citation will make it accessible to the workbench. Right-clicking a
      theme or citation causes a context menu to apper with options.</p>

      <p>Themes and citations can be copied and pasted onto another theme. Theme names and descriptions can be edited.
      The order of subthemes and citations contained in a theme can be rearranged in the workbench. Citations can be
      edited in the workbench or deleted. Pasting a citation onto a theme will cause the same citation to referenced
      from more than one theme. Editing the citation will edit it in all themes that reference it. Deleting a
      citation will only delete the reference to the citation if more than one reference exists.</p>

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
      features are not yet implemented. The operator can click the buttons on the toolbar, or for many of
      the operations the Bible Theme Tree context menu can initiate a workbench operation.</p>

      <p>The magifying glass button <i class="ps-icon ps-icon-search"></i> opens the search tool.
      The search engine allows the operator to search for scripture verses by text. Wildcards and
      regular expressions can be used to enhance the search. Search results can be selected and
      saved as citations.</p>

      <p>The create button <i class="ps-icon ps-icon-create"></i> opens the create tool. The create tool
      allows the operator to create themes and citations as a child of the active theme.</p>

      <p>The edit button <i class="ps-icon ps-icon-edit"></i> opens the edit tool. The edit tool allows the
      operator to edit the active theme or citation. Themes can be renamed and given descriptions. Citations
      can have their descriptions and verse ranges edited. Individual verses can be "marked up" by
      use of the markup editor.</p>

      <p>The delete button <i class="ps-icon ps-icon-delete"></i> opens the delete tool. The delete tool allows the
      operator to delete the active theme or citation. Deleting a theme will also delete all of the themes and
      citations it contains. Deleting a citation will only delete the reference to the citation if more than one
      reference exists.</p>

      <p>The import button <i class="ps-icon ps-icon-import"></i> opens the import tool. The import tool provides
      an input console for creating themes and citations by keyboard entry. The tool allows navigation along
      the theme tree opening themes for the purpose of creating themes and citations as children of the opened
      theme. There is an undo and redo feature. The operator can save changes in bulk or roll them back.
      Future expansion will allow for the import of archived themes.</p>

      <p>The publish button <i class="ps-icon ps-icon-scenario"></i> is not yet implemented. It will allow the
      operator to generate reports of themes and citations, and the export of Power Scripture themes for archive
      or import into another Power Scripture installation.</p>

      <p>The Help button <i class="ps-icon ps-icon-help"></i> Opens the help page you are currently viewing.</p>
    `
  }
];
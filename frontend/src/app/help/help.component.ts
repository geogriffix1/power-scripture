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
    group: 'concepts',
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
    group: 'concepts',
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
    group: 'concepts',
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
  },
  {
    id: 'search',
    title: 'Search',
    iconClass: 'ps-icon ps-icon-search',
    group: 'tools',
    content: `
      <h2>Search</h2>

      <p>
      The search tool is used to locate scripture verses by matching text content.
      Searches are performed in Bible order, which is the same order scripture appears in the Bible.
      </p>

      <p>
      Open the search tool by clicking the magnifying glass button
      <i class="ps-icon ps-icon-search"></i> on the Workbench toolbar.
      </p>

      <h3>Standard Searches</h3>

      <p>
      Standard searches are optimized for speed and are appropriate for most searches.
      Searches match scripture verses containing the entered text.
      Partial word and phrase matching are supported.
      </p>

      <p>
      Wildcard searches are supported in standard search mode.
      </p>

      <ul>
        <li><b>%</b> — Matches zero or more characters</li>
        <li><b>_</b> — Matches a single character</li>
      </ul>

      <p>
      Examples:
      </p>

      <ul>
        <li><code>Jer%</code> matches words beginning with "Jer"</li>
        <li><code>m_n</code> matches three-letter words such as "man" or "men"</li>
      </ul>

      <h3>Advanced Searches</h3>

      <p>
      Advanced search mode enables regular expression pattern matching for more complex searches.
      When advanced mode is enabled, special pattern characters are interpreted according to regular expression rules.
      </p>

      <p>
      Advanced mode also supports normal text searches, but searches performed in advanced mode are typically slower than standard searches.
      </p>

      <p>
      Advanced search mode is intended for specialized searches and is usually not required for normal use.
      </p>

      <h3>Search Results</h3>

      <p>
      Each search result is presented as an individual scripture verse.
      Results are displayed in Bible order.
      </p>

      <p>
      Each verse is displayed with a citation label identifying the scripture reference.
      Citation labels contain the book, chapter, and verse reference associated with the scripture text.
      </p>

      <p>
      Search results can be selected or deselected individually.
      Selected verses can later be grouped into citations.
      </p>

      <h3>Match Highlighting</h3>

      <p>
      Matching portions of scripture text are highlighted within search results.
      Highlighting identifies the exact text that caused the verse to match the search criteria.
      </p>

      <p>
      Highlighting is especially useful when using wildcard or advanced search patterns,
      where the matching text may not be immediately obvious.
      </p>

      <h3>Search Result Context Menu</h3>

      <p>
      Right-clicking the search results displays a context menu with additional operations.
      </p>

      <ul>
        <li>
          <b>Select All</b> — Selects all displayed search results.
        </li>

        <li>
          <b>Deselect All</b> — Clears all selected search results.
        </li>

        <li>
          <b>Remove Selected</b> — Removes selected verses from the current search results display.
          This operation does not delete scripture or citations from the database.
        </li>

        <li>
          <b>Create Citation</b> — Creates a citation from selected verses under the active theme.
        </li>

        <li>
          <b>Export Selected</b> — Exports selected verses to a Microsoft Word document.
        </li>
      </ul>

      <h3>Citation Creation</h3>

      <p>
      Creating a citation requires an active theme.
      The active theme is determined by the currently selected theme in the Bible Theme Tree.
      </p>

      <p>
      After creation, the citation immediately appears in the Theme Tree under the active theme.
      </p>

      <h3>Search Limits</h3>

      <p>
      Search results are limited to maintain responsiveness and to prevent excessively broad searches from returning large portions of scripture.
      </p>

      <p>
      If a search returns too many results, refine the search by entering a more specific word or phrase.
      </p>
` },
  {
    id: 'create',
    title: 'Create',
    iconClass: 'ps-icon ps-icon-create',
    group: 'tools',
    content: `
      <h2>Create</h2>

      <p>
      The create tool is used to create new themes and citations under the active theme.
      An active theme is required before a theme or citation can be created.
      </p>

      <p>
      The active theme is displayed as a full path of theme names separated by forward slashes.
      If no theme is active, the create tool displays an error message where the active theme path would normally appear.
      </p>

      <h3>Opening Create</h3>

      <p>
      Clicking the create button <i class="ps-icon ps-icon-create"></i> on the Workbench toolbar opens a choice between:
      </p>

      <ul>
        <li><b>Create a new Bible Theme</b></li>
        <li><b>Create a new Bible Citation</b></li>
      </ul>

      <p>
      Create can also be opened from the Bible Theme Tree.
      Right-click a theme and select <b>Create Theme</b> or <b>Create Citation</b> to open the selected create tool directly.
      </p>

      <h3>Create Theme</h3>

      <p>
      Create Theme creates a new theme as a child of the active theme.
      </p>

      <p>
      The Create Theme form contains:
      </p>

      <ul>
        <li><b>Theme name</b> — required</li>
        <li><b>Theme description</b> — optional</li>
      </ul>

      <p>
      The Theme Name field placeholder text is <b>Theme name</b>.
      The Theme Description field placeholder text is <b>Theme description (optional)</b>.
      </p>

      <p>
      Theme descriptions are optional. Descriptions are displayed as tooltips or titles
      when hovering over theme nodes in the Bible Theme Tree.
      Empty descriptions display no notation.
      </p>

      <p>
      Click the save button <i class="ps-icon ps-icon-save"></i> to create the theme.
      After saving, the Bible Theme Tree refreshes to show the new theme under its parent theme.
      </p>

      <p>
      Create Theme does not display a corresponding edit shortcut because all editable properties
      of a newly created theme are already available in the Create Theme tool.
      </p>

      <h3>Create Citation</h3>

      <p>
      Create Citation creates a new citation as a child of the active theme.
      </p>

      <p>
      The Create Citation form contains one optional description field.
      </p>

      <p>
      The citation description placeholder text is
      <b>Citation description (optional)</b>.
      </p>

      <p>
      Click the save button <i class="ps-icon ps-icon-save"></i> to create the citation.
      A citation created in this manner initially contains no scripture verses.
      </p>

      <p>
      Empty citations appear in the Bible Theme Tree with the label <b>[empty]</b>.
      Verses can be added later in the citation editor.
      </p>

      <p>
      After creating a citation, an <b>Edit Citation</b> button appears with the edit icon
      <i class="ps-icon ps-icon-edit"></i>. Clicking this button opens the citation editor.
      </p>

      <p>
      This provides a shortcut for immediately adding verses and markups to a newly created citation.
      </p>

      <h3>Descriptions</h3>

      <p>
      Theme and citation descriptions are optional.
      When provided, descriptions are displayed as tooltips or titles for nodes in the Bible Theme Tree.
      Empty descriptions display no notation.
      </p>
    `
  },
  {
    id: 'edit',
    title: 'Edit',
    iconClass: 'ps-icon ps-icon-edit',
    group: 'tools',
    content: `
      <h2>Edit</h2>

      <p>
      The edit tool is used to modify the active theme or active citation.
      Editing operations are performed in the Workbench.
      </p>

      <p>
      Clicking the edit button <i class="ps-icon ps-icon-edit"></i> on the Workbench toolbar
      opens a choice between:
      </p>

      <ul>
        <li><b>Edit Theme</b></li>
        <li><b>Edit Citation</b></li>
      </ul>

      <p>
      Edit can also be opened directly from the Bible Theme Tree context menu.
      </p>

      <h3>Theme Editing</h3>

      <p>
      Theme editing focuses on structure and organization.
      Themes can be renamed, described, and reorganized.
      Child themes and citations can be reordered using drag-and-drop operations.
      </p>

      <h3>Citation Editing</h3>

      <p>
      Citation editing focuses on scripture organization and presentation.
      Citations can contain one or more scripture ranges displayed in Bible order.
      </p>

      <p>
      Citation editing supports:
      </p>

      <ul>
        <li>description editing</li>
        <li>adding scripture ranges</li>
        <li>removing scripture ranges</li>
        <li>markup editing</li>
        <li>verse suppression</li>
        <li>scripture clarification markups</li>
      </ul>

      <h3>Markup Editing</h3>

      <p>
      Markup editing modifies how scripture is presented inside a citation.
      Markups do not alter the underlying scripture text.
      </p>

      <p>
      Text within verses can be highlighted, suppressed, or replaced with clarification text.
      Replacement text is displayed using bracket notation.
      </p>
    `
  },
  {
    id: 'delete',
    title: 'Delete',
    iconClass: 'ps-icon ps-icon-delete',
    group: 'tools',
    content: `...`
  },
  {
    id: 'import',
    title: 'Import',
    iconClass: 'ps-icon ps-icon-import',
    group: 'tools',
    content: `...`
  },
  {
    id: 'publish',
    title: 'Publish',
    iconClass: 'ps-icon ps-icon-publish',
    group: 'tools',
    content: `...`
  },
{
  id: 'theme-editing',
  title: 'Theme Editing',
  iconClass: 'ps-icon ps-icon-folder',
  group: 'editing',
  content: `
    <h2>Theme Editing</h2>

    <p>
    Theme editing is used to modify the active theme and organize its child themes and citations.
    Theme editing is performed in the Workbench.
    </p>

    <p>
    Open Theme Editing by clicking the edit button
    <i class="ps-icon ps-icon-edit"></i> on the Workbench toolbar and selecting
    <b>Edit Theme</b>.
    Theme editing can also be opened from the Bible Theme Tree context menu.
    </p>

    <h3>Active Theme</h3>

    <p>
    Theme editing operates on the active theme, not the parent theme.
    The active theme is displayed as a full theme path with theme names separated by forward slashes.
    </p>

    <p>
    If no active theme exists, the editor displays an error message where the active theme path would normally appear.
    </p>

    <h3>Theme Properties</h3>

    <p>
    Empty themes can modify:
    </p>

    <ul>
      <li><b>Theme name</b></li>
      <li><b>Theme description</b></li>
    </ul>

    <p>
    Theme descriptions are optional.
    Descriptions are displayed as tooltips or titles in the Bible Theme Tree.
    Empty descriptions display no notation.
    </p>

    <h3>Child Theme and Citation Lists</h3>

    <p>
    Themes containing subthemes or citations display expandable accordion sections.
    </p>

    <p>
    Child theme counts and citation counts are displayed when greater than zero.
    Accordion headers display an arrow icon pointing to the right when collapsed.
    Clicking the header rotates the arrow downward and reveals the associated content.
    </p>

    <h3>Theme Reordering</h3>

    <p>
    Child themes can be reordered using drag-and-drop operations.
    </p>

    <p>
    Theme sequence numbers are displayed together with theme names.
    Changes are applied immediately both visually and within the database.
    </p>

    <h3>Citation Reordering</h3>

    <p>
    Citations belonging to the active theme can also be reordered using drag-and-drop operations.
    </p>

    <p>
    Citation sequence numbers and citation labels are displayed within the citation list.
    Changes are applied immediately both visually and within the database.
    </p>
  `
},
{
  id: 'citation-editing',
  title: 'Citation Editing',
  iconClass: 'ps-icon ps-icon-script',
  group: 'editing',
  content: `
    <h2>Citation Editing</h2>

    <p>
    Citation editing is used to manage scripture ranges, citation descriptions,
    and scripture presentation within the active citation.
    Citation editing is performed in the Workbench.
    </p>

    <p>
    Open Citation Editing by clicking the edit button
    <i class="ps-icon ps-icon-edit"></i> on the Workbench toolbar and selecting
    <b>Edit Citation</b>.
    Citation editing can also be opened from the Bible Theme Tree context menu.
    </p>

    <h3>Active Citation</h3>

    <p>
    Citation editing operates on the active citation.
    The citation label is displayed in gold text at the top of the editor.
    </p>

    <p>
    If the citation contains no scripture ranges, the citation label displays
    <b>[empty]</b>.
    </p>

    <h3>Citation Description</h3>

    <p>
    Citation descriptions are optional.
    </p>

    <p>
    If a description exists, it is displayed within the citation description textbox.
    Otherwise the textbox displays the placeholder text
    <b>Citation description (optional)</b>.
    </p>

    <p>
    Clicking the save button
    <i class="ps-icon ps-icon-save"></i>
    saves changes to the citation description.
    </p>

    <h3>Adding Scripture Ranges</h3>

    <p>
    Citation editing includes a scripture range selection component used to locate
    scripture by book, chapter, verse, and ending verse.
    </p>

    <p>
    Scripture range selection is progressive.
    Available controls activate as required information becomes available.
    </p>

    <ul>
      <li>
        <b>Book</b> — Displays Bible books and narrows the list while typing.
      </li>

      <li>
        <b>Chapter</b> — Activates after a book is selected.
      </li>

      <li>
        <b>Verse</b> — Activates after both book and chapter are selected.
      </li>

      <li>
        <b>End Verse</b> — Activates after the beginning verse is selected.
      </li>
    </ul>

    <p>
    The ending verse initially duplicates the beginning verse.
    The ending verse can then be confirmed or changed before searching.
    </p>

    <h3>Scripture Range Preview</h3>

    <p>
    Clicking the search button
    <i class="ps-icon ps-icon-search"></i>
    opens a temporary preview panel displaying the scripture label and scripture text
    for the selected range.
    </p>

    <p>
    The preview panel contains:
    </p>

    <ul>
      <li>
        <b>Add</b>
        <i class="ps-icon ps-icon-add"></i>
        — Adds the scripture range to the citation.
      </li>

      <li>
        <b>Cancel</b>
        <i class="ps-icon ps-icon-close"></i>
        — Closes the preview panel without changes.
      </li>
    </ul>

    <p>
    Both actions close the preview panel.
    </p>

    <h3>Scripture Range List</h3>

    <p>
    Scripture ranges belonging to the citation are displayed beneath the scripture
    range selector in Bible order.
    </p>

    <p>
    Scripture ranges are displayed using accordion sections.
    Clicking the accordion header rotates the arrow icon and reveals the scripture text
    contained within the range.
    </p>

    <h3>Range Operations</h3>

    <p>
    Scripture range headers contain edit and delete buttons.
    </p>

    <ul>
      <li>
        <b>Edit</b>
        <i class="ps-icon ps-icon-edit"></i>
        — Opens the markup editor for the selected scripture range.
      </li>

      <li>
        <b>Delete</b>
        <i class="ps-icon ps-icon-delete"></i>
        — Removes the scripture range from the citation.
      </li>
    </ul>

    <h3>Markup Editing</h3>

    <p>
    The markup editor is used to control how scripture text is presented within a citation.
    Markups do not alter the underlying scripture text.
    </p>

    <p>
    Markup editing supports:
    </p>

    <ul>
      <li>verse suppression</li>
      <li>text highlighting</li>
      <li>clarification text</li>
      <li>replacement text using bracket notation</li>
    </ul>

    <p>
    Verse suppression replaces displayed scripture text with an ellipsis.
    </p>
  `
},
{
  id: 'markup-editor',
  title: 'Markup Editing',
  iconClass: 'ps-icon ps-icon-markup',
  group: 'editing',
  content: `...`
}
];
import { Component, ElementRef, ViewChild } from '@angular/core';
import { HelpTopic } from '../model/help-topic.model';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrl: './help.component.css'
})
export class HelpComponent {
  @ViewChild('contentPanel')
  contentPanel?: ElementRef<HTMLDivElement>;

  topics = HELP_TOPICS;
  activeTopic = HELP_TOPICS[0];

  selectTopic(topic: HelpTopic): void {
    this.activeTopic = topic;

    queueMicrotask(() => {
      this.contentPanel?.nativeElement.scrollTo({
        top: 0,
        behavior: 'instant' as ScrollBehavior
      });
    });
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

      <p>Scripture text in Power Scripture is immutable. Citations, verses, and markups control
      how scripture is organized and rendered without modifying the underlying Bible text.</p>

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
      Citations do not have names. They are labeled with the verses they contain. Citations can have
      descriptions. Descriptions are optional. They appear as a tooltip when hovering over a citation node
      on the Theme Tree.</p>

      <p>Clicking a theme or citation activates it. Only one theme and one citation can be active at a time.
      Activating a theme or citation makes it accessible to the Workbench. Right-clicking a theme or citation
      displays a context menu with available commands.</p>

      <p>Themes and citations can be copied and pasted onto another theme. Pasting a citation onto a theme
      causes the same citation to be referenced from more than one theme. Editing that citation affects all
      themes that reference that citation. Deleting a citation that is referenced by multiple themes only
      removes the association between the selected theme and the citation.</p>

      <p>Top-level themes cannot be renamed or deleted. The member themes and citations can be rearranged in
      the Workbench editor.</p>
    `
  },
  {
    id: 'workbench',
    title: 'Workbench',
    iconClass: 'ps-icon ps-icon-workbench',
    group: 'concepts',
    content: `
      <h2>Workbench</h2>

      <p>The Workbench is the right pane of the Power Scripture application. It is used to perform most of
      the actions of the application. The Workbench has a toolbar with buttons for the various actions
      supported by the application.</p>

      <p>The Workbench is organized by action: search, create, edit, delete, import, publish, and help.
      Some features are not yet implemented. Invoke actions by clicking toolbar buttons or using the Bible
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
      the active theme or citation. Themes can be renamed and given descriptions. Citations can have their
      descriptions and verse ranges edited. Individual verses can be marked up by use of the markup editor.</p>

      <h3>Delete</h3>
      <p>The delete button <i class="ps-icon ps-icon-delete"></i> opens the delete tool. The delete tool allows
      deletion of the active theme or citation. Deleting a theme will also delete all of the themes and
      citations it contains. Deleting a citation will only delete the reference to the citation if more than one
      reference exists.</p>

      <h3>Import</h3>
      <p>The import button <i class="ps-icon ps-icon-import"></i> opens the import tool. The import tool provides
      an input console for creating themes and citations by keyboard entry. The tool allows navigation along
      the Theme Tree, opening themes for the purpose of creating themes and citations as children of the opened
      theme. There is an undo and redo feature. Changes can be saved in bulk or rolled back.
      Future expansion will allow for the import of archived themes.</p>

      <h3>Publish</h3>
      <p>The publish button <i class="ps-icon ps-icon-publish"></i> is not yet implemented. It will allow report
      generation for themes and citations, and the export of Power Scripture themes for archive or import into
      another Power Scripture installation.</p>

      <h3>Help</h3>
      <p>The Help button <i class="ps-icon ps-icon-help"></i> opens the help page you are currently viewing.</p>
    `
  },
  {
    id: 'citations',
    title: 'Citations and Ranges',
    iconClass: 'ps-icon ps-icon-script',
    group: 'concepts',
    content: `
      <h2>Citations and Ranges</h2>

      <p>A citation is a collection of scripture verse references. Citations do not store scripture text directly.</p>

      <p>Instead, a citation contains citation verses. Each citation verse belongs to one citation and references
      one immutable scripture record. Markups belong to citation verses and also belong to one citation.</p>

      <p>This design allows the same scripture to appear differently in different citations without modifying
      the underlying Bible text.</p>

      <h3>Ranges Are Not Stored Entities</h3>

      <p>Ranges are not stored in the database. A range is an inferred cluster of consecutive citation verses
      within the same chapter.</p>

      <p>When more than one consecutive verse appears within the same chapter, the citation label summarizes
      the range using a dash between the first and last verse number.</p>

      <p>For example, consecutive verses may be summarized as <code>John 3:16-18</code>.</p>

      <p>Citation labels are computed by the backend. They are not independent database records. A stored
      procedure computes the label before citation data is returned to the application.</p>

      <h3>Rendered Citations</h3>

      <p>Rendered citations are displayed as a series of rendered ranges separated by commas. Each range is
      rendered as an ordered sequence of verses.</p>
    `
  },
  {
    id: 'search',
    title: 'Search',
    iconClass: 'ps-icon ps-icon-search',
    group: 'tools',
    content: `
      <h2>Search</h2>

      <p>The search tool is used to locate scripture verses by matching text content.
      Searches are performed in Bible order, which is the same order scripture appears in the Bible.</p>

      <p>Open the search tool by clicking the magnifying glass button
      <i class="ps-icon ps-icon-search"></i> on the Workbench toolbar.</p>

      <h3>Standard Searches</h3>

      <p>Standard searches are optimized for speed and are appropriate for most searches.
      Searches match scripture verses containing the entered text. Partial word and phrase matching are supported.</p>

      <p>Wildcard searches are supported in standard search mode.</p>

      <ul>
        <li><b>%</b> — Matches zero or more characters</li>
        <li><b>_</b> — Matches a single character</li>
      </ul>

      <h3>Advanced Searches</h3>

      <p>Advanced search mode enables regular expression pattern matching for more complex searches.
      Advanced searches are typically slower than standard searches.</p>

      <h3>Search Results</h3>

      <p>Each search result is presented as an individual scripture verse. Results are displayed in Bible order.</p>

      <p>Matching portions of scripture text are highlighted within search results. Highlighting identifies the
      exact text that caused the verse to match the search criteria.</p>

      <h3>Search Result Context Menu</h3>

      <p>Right-clicking the search results displays a context menu with additional operations.</p>

      <ul>
        <li><b>Select All</b> — Selects all displayed search results.</li>
        <li><b>Deselect All</b> — Clears all selected search results.</li>
        <li><b>Remove Selected</b> — Removes selected verses from the current search results display. This does not delete scripture or citations.</li>
        <li><b>Create Citation</b> — Creates a citation from selected verses under the active theme.</li>
        <li><b>Export Selected</b> — Exports selected verses to a Microsoft Word document.</li>
      </ul>

      <h3>Citations from Search Results</h3>

      <p>Citations created from search results are often disjointed collections of verses that happen to share
      a name, word, phrase, or concept.</p>

      <p>These citations can later be expanded in the citation editor by adding scripture ranges. When added
      ranges overlap verses already in the citation, existing verses are not duplicated.</p>
    `
  },
  {
    id: 'create',
    title: 'Create',
    iconClass: 'ps-icon ps-icon-create',
    group: 'tools',
    content: `
      <h2>Create</h2>

      <p>The create tool is used to create new themes and citations under the active theme.
      An active theme is required before a theme or citation can be created.</p>

      <p>The active theme is displayed as a full path of theme names separated by forward slashes.
      If no theme is active, the create tool displays an error message where the active theme path would normally appear.</p>

      <h3>Opening Create</h3>

      <p>Clicking the create button <i class="ps-icon ps-icon-create"></i> on the Workbench toolbar opens a choice between:</p>

      <ul>
        <li><b>Create a new Bible Theme</b></li>
        <li><b>Create a new Bible Citation</b></li>
      </ul>

      <p>Create can also be opened from the Bible Theme Tree. Right-click a theme and select <b>Create Theme</b>
      or <b>Create Citation</b> to open the selected create tool directly.</p>

      <h3>Create Theme</h3>

      <p>Create Theme creates a new theme as a child of the active theme. The form contains a required theme name
      and an optional theme description.</p>

      <p>Click the save button <i class="ps-icon ps-icon-save"></i> to create the theme. After saving,
      the Bible Theme Tree refreshes to show the new theme under its parent theme.</p>

      <h3>Create Citation</h3>

      <p>Create Citation creates a new citation as a child of the active theme. The citation description is optional.</p>

      <p>A citation created in this manner initially contains no scripture verses. Empty citations appear in the
      Bible Theme Tree with the label <b>[empty]</b>. Verses can be added later in the citation editor.</p>

      <p>After creating a citation, an <b>Edit Citation</b> button appears with the edit icon
      <i class="ps-icon ps-icon-edit"></i>. Clicking this button opens the citation editor.</p>
    `
  },
  {
    id: 'edit',
    title: 'Edit',
    iconClass: 'ps-icon ps-icon-edit',
    group: 'tools',
    content: `
      <h2>Edit</h2>

      <p>The edit tool is used to modify the active theme or active citation. Editing operations are performed in the Workbench.</p>

      <p>Clicking the edit button <i class="ps-icon ps-icon-edit"></i> on the Workbench toolbar opens a choice between:</p>

      <ul>
        <li><b>Edit Theme</b></li>
        <li><b>Edit Citation</b></li>
      </ul>

      <p>Edit can also be opened directly from the Bible Theme Tree context menu.</p>

      <h3>Theme Editing</h3>

      <p>Theme editing focuses on structure and organization. Themes can be renamed, described, and reorganized.
      Child themes and citations can be reordered using drag-and-drop operations.</p>

      <h3>Citation Editing</h3>

      <p>Citation editing focuses on scripture organization and presentation. Citations can contain one or more
      scripture ranges displayed in Bible order.</p>

      <p>Citation editing supports description editing, adding scripture ranges, removing scripture ranges,
      verse selection, whole-verse hiding, and markup editing.</p>
    `
  },
  {
    id: 'delete',
    title: 'Delete',
    iconClass: 'ps-icon ps-icon-delete',
    group: 'tools',
    content: `
      <h2>Delete</h2>

      <p>The delete tool is used to delete the active theme or citation.</p>

      <p>Deleting a theme deletes the selected theme and its contained subthemes and citation links.</p>

      <p>Deleting a citation from a theme removes the selected citation relationship from that theme. If the same
      citation is referenced by multiple themes, deleting it from one theme does not remove the citation from the
      other themes.</p>

      <p>Delete operations should be used carefully because theme deletion affects the entire theme cascade.</p>
    `
  },
  {
    id: 'import',
    title: 'Import',
    iconClass: 'ps-icon ps-icon-import',
    group: 'tools',
    content: `
      <h2>Import</h2>

      <p>The import tool provides an input console for creating themes and citations by keyboard entry.</p>

      <p>The console supports navigation along the theme tree, opening themes for the purpose of creating themes
      and citations as children of the opened theme.</p>

      <p>The import console supports undo and redo. Changes can be saved in bulk or rolled back.</p>

      <p>Future expansion will allow the import of archived themes and structured content files.</p>
    `
  },
  {
    id: 'publish',
    title: 'Publish',
    iconClass: 'ps-icon ps-icon-publish',
    group: 'tools',
    content: `
      <h2>Publish</h2>

      <p>Publish is not yet implemented.</p>

      <p>Publish will support report generation for themes and citations and the export of Power Scripture themes
      for archive or import into another Power Scripture installation.</p>

      <p>Planned output formats may include Word, HTML, JSON, and PDF.</p>
    `
  },
  {
    id: 'theme-editing',
    title: 'Theme Editing',
    iconClass: 'ps-icon ps-icon-folder',
    group: 'editing',
    content: `
      <h2>Theme Editing</h2>

      <p>Theme editing is used to modify the active theme and organize its child themes and citations.
      Theme editing is performed in the Workbench.</p>

      <p>Open Theme Editing by clicking the edit button <i class="ps-icon ps-icon-edit"></i> on the Workbench
      toolbar and selecting <b>Edit Theme</b>. Theme editing can also be opened from the Bible Theme Tree context menu.</p>

      <h3>Active Theme</h3>

      <p>Theme editing operates on the active theme. The active theme is displayed as a full theme path with
      theme names separated by forward slashes.</p>

      <h3>Theme Properties</h3>

      <p>The editor can modify the theme name and optional theme description.</p>

      <p>Theme descriptions are displayed as tooltips or titles in the Bible Theme Tree. Empty descriptions display no notation.</p>

      <h3>Child Theme and Citation Lists</h3>

      <p>Themes containing subthemes or citations display expandable accordion sections. Child theme counts and citation
      counts are displayed when greater than zero.</p>

      <h3>Reordering</h3>

      <p>Child themes and citations belonging to the active theme can be reordered using drag-and-drop operations.
      Changes are applied immediately both visually and within the database.</p>
    `
  },
  {
    id: 'citation-editing',
    title: 'Citation Editing',
    iconClass: 'ps-icon ps-icon-script',
    group: 'editing',
    content: `
      <h2>Citation Editing</h2>

      <p>Citation editing is used to manage scripture ranges, citation descriptions, and scripture presentation
      within the active citation. Citation editing is performed in the Workbench.</p>

      <p>Open Citation Editing by clicking the edit button <i class="ps-icon ps-icon-edit"></i> on the Workbench toolbar
      and selecting <b>Edit Citation</b>. Citation editing can also be opened from the Bible Theme Tree context menu.</p>

      <h3>Active Citation</h3>

      <p>Citation editing operates on the active citation. The citation label is displayed in gold text at the top of the editor.</p>

      <p>If the citation contains no scripture verses, the citation label displays <b>[empty]</b>.</p>

      <h3>Citation Description</h3>

      <p>Citation descriptions are optional. If a description exists, it is displayed within the citation description textbox.
      Otherwise the textbox displays the placeholder text <b>Citation description (optional)</b>.</p>

      <p>Clicking the save button <i class="ps-icon ps-icon-save"></i> saves changes to the citation description.</p>

      <h3>Adding Scripture Ranges</h3>

      <p>Citation editing includes a scripture range selection component used to locate scripture by book, chapter,
      verse, and ending verse.</p>

      <p>Scripture range selection is progressive. Available controls activate as required information becomes available.</p>

      <ul>
        <li><b>Book</b> — Displays Bible books and narrows the list while typing.</li>
        <li><b>Chapter</b> — Activates after a book is selected.</li>
        <li><b>Verse</b> — Activates after both book and chapter are selected.</li>
        <li><b>End Verse</b> — Activates after the beginning verse is selected.</li>
      </ul>

      <p>The ending verse initially duplicates the beginning verse. The ending verse can then be confirmed or changed before searching.</p>

      <h3>Scripture Range Preview</h3>

      <p>Clicking the search button <i class="ps-icon ps-icon-search"></i> opens a temporary preview panel displaying
      the scripture label and scripture text for the selected range. Previewed ranges are displayed with a blue background.</p>

      <p>The preview panel contains an <b>Add</b> button <i class="ps-icon ps-icon-add"></i> and a <b>Cancel</b> button
      <i class="ps-icon ps-icon-close"></i>. Add accepts the range. Cancel closes the preview without changes.</p>

      <h3>Overlapping Ranges</h3>

      <p>Ranges may overlap verses already contained in the citation. Overlapping ranges are fully supported.</p>

      <p>When a range overlaps existing citation verses, Power Scripture does not duplicate verses already present
      in the citation. Instead, only missing verses are added.</p>

      <p>This allows citations to be expanded naturally during study. For example, a citation initially created from
      search results may later be expanded to include an entire chapter without creating duplicate verses.</p>

      <p>Ranges may also be previewed and rejected without modifying the citation. This allows surrounding scripture
      context to be reviewed before deciding which verses should be included.</p>

      <h3>Scripture Range List</h3>

      <p>Scripture ranges belonging to the citation are displayed beneath the scripture range selector in Bible order.</p>

      <p>Scripture ranges are displayed using accordion sections. Clicking the accordion header rotates the arrow icon
      and reveals the scripture text contained within the range.</p>

      <h3>Range Operations</h3>

      <p>Scripture range headers contain edit and delete buttons.</p>

      <ul>
        <li><b>Edit</b> <i class="ps-icon ps-icon-edit"></i> — Opens the verse selector and markup editor for the selected scripture range.</li>
        <li><b>Delete</b> <i class="ps-icon ps-icon-delete"></i> — Removes the scripture range from the citation.</li>
      </ul>

      <h3>Removing Scripture</h3>

      <p>Scripture ranges can be removed from a citation. Removing a range deletes the citation verses associated
      with that range from the citation.</p>

      <p>Power Scripture does not currently provide direct deletion of individual verses from within an existing range.
      Individual verses may instead be omitted in one of two ways:</p>

      <ul>
        <li>Use the verse <b>Hide</b> checkbox to suppress the verse during rendering while keeping the verse as part of the citation.</li>
        <li>Remove the existing range and create replacement ranges that exclude the unwanted verses.</li>
      </ul>

      <p>Hidden verses remain part of the citation and do not alter the citation label or range nomenclature.
      Replacing ranges changes the actual verse membership of the citation and therefore changes the computed citation label.</p>
    `
  },
  {
    id: 'verse-selector',
    title: 'Verse Selector',
    iconClass: 'ps-icon ps-icon-script',
    group: 'editing',
    content: `
      <h2>Verse Selector</h2>

      <p>The Verse Selector displays a selected scripture range as an ordered list of individual verses.
      Each verse is rendered using its persisted markup state.</p>

      <p>The Verse Selector does not create scripture ranges. Range selection belongs to the Citation Editor.</p>

      <p>The Verse Selector is responsible for selecting active verses, opening the Markup Editor, saving or discarding
      markup changes, and controlling whole-verse hiding.</p>

      <h3>Opening Markup Editing</h3>

      <p>Each verse contains a blue <b>Markup</b> button. Clicking the Markup button opens the Markup Editor for that verse.</p>

      <p>The Verse Selector displays the Markup Editor header and the Markup Editor beneath it. The header provides
      controls for saving changes or closing the editor without saving changes.</p>

      <p>The Markup Editor remains visible until it is closed. Markup changes are take-it-or-leave-it for one active verse:
      saving commits the active verse markup draft, while closing without saving discards it.</p>

      <h3>Hide Verse</h3>

      <p>The Verse Selector includes a <b>Hide</b> checkbox for each verse.</p>

      <p>When Hide is checked, the entire verse is rendered as an ellipsis. If two or more consecutive verses are hidden,
      they are represented by a single ellipsis rather than one ellipsis per verse.</p>

      <p>Verse hiding affects only the rendered presentation of scripture ranges. Hidden verses remain members of the citation
      and do not alter the citation label or scripture range nomenclature.</p>

      <p>Checking or unchecking Hide is persisted immediately. Hiding and unhiding verses does not participate in the Markup Editor
      save/discard workflow.</p>

      <p>Hidden verses do not lose their markups. If a hidden verse is later unhidden, any saved markups that were not separately
      deleted are applied during rendering.</p>
    `
  },
  {
    id: 'markup-editor',
    title: 'Markup Editing',
    iconClass: 'ps-icon ps-icon-markup',
    group: 'editing',
    content: `
      <h2>Markup Editing</h2>

      <p>The Markup Editor edits one active verse at a time. It does not edit existing markup records directly.
      Instead, the user edits a verse by applying operations that build a working markup collection for that verse.</p>

      <p>Markup editing is like CRUD without the U: operations add markups, and Delete All removes the working markup collection.
      Existing markups are not individually edited in place.</p>

      <h3>Opening the Markup Editor</h3>

      <p>Markup editing is opened by clicking the blue <b>Markup</b> button on a verse in the Verse Selector.</p>

      <p>Opening the Markup Editor displays the pristine Bible verse text on the right side. The pristine verse is always visible
      and uses a parchment-colored background. It is the authoritative scripture text and is never modified by markup operations.</p>

      <h3>Rendered Verse</h3>

      <p>The <b>Rendered Verse</b> panel displays a live preview of the active verse using the current working markup collection.</p>

      <p>The Rendered Verse panel may include markups that are already persisted and markups that have been added or removed in the
      current unsaved editing session.</p>

      <p>The Rendered Verse panel is visible only when the current working markup collection contains at least one markup.</p>

      <h3>Range Preview</h3>

      <p>The preview panel renders the entire scripture range associated with the citation for context.</p>

      <p>Non-active verses render using persisted markup state. The active verse renders using the current unpersisted draft state.
      This allows the active verse to be evaluated in the context of surrounding scripture before changes are saved.</p>

      <p>The preview panel may be shown or hidden while editing.</p>

      <h3>Markup Operations</h3>

      <p>Markup operations are applied against positions within the pristine scripture text. Some operations require a selected span
      of text. Other operations act at a caret location between two characters.</p>

      <h3>Span Operations</h3>

      <p>Span operations require a section of the pristine verse text to be selected before the operation is applied.</p>

      <ul>
        <li><b>Highlight</b> — Highlights the selected text.</li>
        <li><b>Suppress</b> — Hides the selected text from rendered output.</li>
        <li><b>Replace</b> — Replaces the selected text with bracketed clarification text.</li>
      </ul>

      <h3>Caret Operations</h3>

      <p>A caret operation is applied at a single insertion point in the pristine verse text.</p>

      <ul>
        <li><b>Paragraph</b> — Inserts a paragraph break at the caret location.</li>
        <li><b>Insert</b> — Inserts bracketed clarification text at the caret location.</li>
      </ul>

      <h3>Clarification Text</h3>

      <p>The Markup Editor contains a <b>Clarification Text</b> input box with the placeholder <b>Type here</b>.
      The text entered there is used by the combined <b>Replace/Insert</b> operation.</p>

      <p>If text is selected in the pristine verse, the operation acts as Replace. The selected text is replaced with
      the clarification text displayed inside brackets.</p>

      <p>If no text span is selected and the caret is placed at a single location, the operation acts as Insert.
      The clarification text is inserted at the caret location inside brackets.</p>

      <h3>Bracket Spacing</h3>

      <p>Inserted or replacement clarification text is displayed using bracket notation. When bracketed text is rendered,
      Power Scripture adds a space before the left bracket if there is not already a space before it. It also adds a space
      after the right bracket if the following character is not a space or punctuation mark.</p>

      <p>Clarification text works best when inserted between words or used to replace complete words or phrases.
      Replacing or inserting clarification text inside part of a word may produce awkward spacing.</p>

      <h3>Delete All</h3>

      <p>The <b>Delete All</b> operation removes all markups from the active verse working collection, including markups
      that were already persisted when the editor was opened.</p>

      <p>Delete All can be undone or redone just like any other operation.</p>

      <h3>Undo and Redo</h3>

      <p>Undo and Redo apply to individual markup operations. Most operations add new markups to the active verse working collection.
      Delete All acts on all markups of the active verse but still participates in the same undo and redo operation history.</p>

      <p>Undo and Redo are scoped to the active verse editing session.</p>

      <h3>Markup Position Rules</h3>

      <p>Power Scripture enforces positional rules to preserve consistent rendering behavior.</p>

      <ul>
        <li>Span operations may not overlap other span operations.</li>
        <li>Caret operations may not be placed inside an existing span operation.</li>
      </ul>

      <p>These restrictions prevent ambiguous rendering behavior and ensure that markup operations render predictably.</p>
    `
  }
];

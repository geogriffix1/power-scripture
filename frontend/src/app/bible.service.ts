import { Injectable } from '@angular/core';
import { ThemeExtendedModel } from './model/theme.model';
import { ThemeChainModel } from './model/themeChain.model';
import { ScriptureModel } from './model/scripture.model';
import { JstreeModel, JstreeState } from './model/jstree.model';
import { ThemeToCitationLinkModel } from './model/themeToCitation.model';

@Injectable({
  providedIn: 'root'
})
export class BibleService {
  ROOT_URL = "http://localhost:8080/";
  //ROOT_URL = "http://localhost:1749/";
  constructor() { }

  async getAllThemes(): Promise<any> {
    let url = `${this.ROOT_URL}themes`;
    const data = await fetch(url);
    const themes = await data.json() ?? [];
  
    console.log("GET ALL THEMES");
    console.log(JSON.stringify(themes));

    return themes;
  }

  async getChildren(parent:number): Promise<JstreeModel[]> {
    console.log(`parent=${parent}`);
    if (parent == 0) {
      // special case because there is no actual node 0.
      // Theme 0 has child themes but no child citations.

      console.log("fetching root themes");

      let rootUrl = `${this.ROOT_URL}themes?parent=0`;
      const data = await fetch(rootUrl);
      const rootThemes = await data.json() ?? [];

      if (rootThemes.length > 1) {
        rootThemes.themes.sort((a:any, b:any) => a.sequence - b.sequence);
      }

      let children = <JstreeModel[]>[];

      for (let i=0; i<rootThemes.themes.length; i++) {
        let theme = new JstreeModel(
          `theme${rootThemes.themes[i].id}`,
          rootThemes.themes[i].name,
          rootThemes.themes[i].description ?? "",
          "theme",
          rootThemes.themes[i].sequence,
          new JstreeState(false, false, false)
        );

        theme.children = rootThemes.themes[i].childCount > 0;
        children.push(theme);
      }

      return children;
    }
    else {
      console.log("fetching child themes");
      let childUrl = `${this.ROOT_URL}themes/${parent}`;
      const data = await fetch(childUrl);
      let parentTheme = await data.json() ?? [];

      if (parentTheme.theme.themes.length > 1) {
        parentTheme.theme.themes.sort((a:any, b:any) => a.theme.sequence - b.theme.sequence);
      }

      if (parentTheme.theme.themeToCitationLinks.length > 1) {
        parentTheme.theme.themeToCitationLinks.sort((a:any, b:any) => a.themeToCitation.sequence - b.themeToCitation.sequence);
      }

      let children = <JstreeModel[]>[];

      for (let i = 0; i < parentTheme.theme.themes.length; i++) {
        let theme = new JstreeModel(
          `theme${parentTheme.theme.themes[i].theme.id}`,
          parentTheme.theme.themes[i].theme.name,
          parentTheme.theme.themes[i].theme.description ?? "",
          "theme",
          parentTheme.theme.themes[i].theme.sequence,
          new JstreeState(false, false, false)
        );

        theme.children = parentTheme.theme.themes[i].theme.childCount > 0;
        children.push(theme);
      }

      for (let i=0; i < parentTheme.theme.themeToCitationLinks.length; i++) {
        let citation = new JstreeModel(
          `citation${parentTheme.theme.themeToCitationLinks[i].themeToCitation.citationId}`,
          parentTheme.theme.themeToCitationLinks[i].themeToCitation.citation.citationLabel,
          parentTheme.theme.themeToCitationLinks[i].themeToCitation.citation.description ?? "",
          "citation",
          parentTheme.theme.themeToCitationLinks[i].themeToCitation.citation.sequence,
          new JstreeState(false, false, false)
        );

        citation.children = false;
        children.push(citation);
      }

      return children;
    }
  }

  async getTheme(id:number) : Promise<ThemeExtendedModel> {
    var url = `${this.ROOT_URL}themes/${id}`;
    const data = await fetch(url);
    const theme = (await data.json() ?? null)
    console.log("GET THEME:");
    console.log(JSON.stringify(theme));
    return <ThemeExtendedModel>theme.theme;
  }

  async getThemeChain(id:number, callback:any) {
    var url = `${this.ROOT_URL}themes/chain/${id}`;
    const data = await fetch(url)
    const chain = (await data.json() ?? [])
    console.log("GET THEME CHAIN");
    console.log(JSON.stringify(chain));
    callback(chain);
  }

  async createTheme(parentId:number, name:string, description:string) {
    var url = `${this.ROOT_URL}themes`;
    const data = await fetch(url, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({parent: parentId, name: name, description: description})
    });

    let theme = await data.json();
    console.log("CREATE THEME");

    console.log(JSON.stringify(theme));

    if (theme.error) {
      let error:ThemeExtendedModel = {
        id: -1,
        name: "",
        description: `Error: ${theme.error}`,
        parent:-1,
        sequence: -1,
        childCount: -1,
        path:"",
        expanded: false,
        themes: [],
        themeToCitationLinks: []
      };
      
      return error;
    }
    return <ThemeExtendedModel>theme;
 }

 async editTheme(theme:ThemeExtendedModel) {
  var url = `${this.ROOT_URL}themes`;
  const data = await fetch(url, {
    method: "PUT",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(theme)
  });

  let response = await data.json();
  console.log("EDIT THEME");

  return response.message;
 }

 async resequenceThemes(parentTheme:number, themes:number[], callback:any) {
  var url = `${this.ROOT_URL}themes/resequence/themes`;
  let themeArray = [];
  themes.forEach(id => themeArray.push({ themeId: id }));
  let obj = { parentTheme: parentTheme, themes: themes };

const data = await fetch(url, {
    method: "PUT",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    },

    body: JSON.stringify(obj)
  });

  let response = await data.json();
  console.log("RESEQUENCE THEMES");
  if (callback) {
    callback(response);
  }
 }

 async resequenceCitations(parentTheme:number, themeToCitations:number[], callback:any) {
  var url = `${this.ROOT_URL}themes/resequence/citations`;
  const data = await fetch(url, {
    method: "PUT",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ parentTheme: parentTheme, themeToCitations: themeToCitations })
  });

  let response = await data.json();
  console.log("RESEQUENCE CITATIONS");
  if (callback) {
    callback(response);
  }
 }

 async deleteTheme(themeId:number, callback:any) {
  var url = `${this.ROOT_URL}themes/${themeId}`;
  const data = await fetch(url, {
    method: "DELETE",
    cache: "no-cache",
    headers: {
      "Content-Type": "application/json"
    }
  });

  console.log("DELETE THEME");
  const result:any = await data.json();
  console.log("result:");
  console.log(result);
  if (result !== null && result.deleteted !== null) {
    console.log("calling back success");
    callback(true, "Theme deleted successfully.");
  }
 }

  async getThemeToCitation(id:number) : Promise<ThemeToCitationLinkModel> {
    var url = `${this.ROOT_URL}themeToCitations/${id}/full`;
    const data = await fetch(url);
    const themeToCitation = (await data.json() ?? null);
    console.log("GET THEME TO CITATION");
    console.log(JSON.stringify(themeToCitation));
    return <ThemeToCitationLinkModel>themeToCitation;
  }

  async citeScriptures(cite:string) : Promise<ScriptureModel[]> {
    var url = `${this.ROOT_URL}scriptures/${cite}`;
    console.log(`citeScriptures ${url}`);
    const data = await fetch(url, {
      method: "GET",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      }
    });

    const searchResults = (await data.json() ?? []);
    console.log("SEARCH SCRIPTURES CONTAINS");
    console.log(JSON.stringify(searchResults));
    return <ScriptureModel[]>searchResults;
  }

  async searchScripturesLike(search:string) : Promise<ScriptureModel[]> {
    console.log(`search like: ${search}`);
    var url = `${this.ROOT_URL}scriptures/like`;
    console.log(`url: ${url}, body: ${JSON.stringify({query: search})}`);
    const data = await fetch(url, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({query: search})
    });

    const searchResults = (await data.json() ?? []);
    console.log("SEARCH SCRIPTURES LIKE");

    if (searchResults )
    console.log(JSON.stringify(searchResults));
    return <ScriptureModel[]>searchResults;
  }
  async searchScripturesContains(search:string) : Promise<ScriptureModel[]> {
    console.log(`search contains: ${search}`);
    var url = `${this.ROOT_URL}scriptures/contains`;
    console.log(`url: ${url}, body: ${JSON.stringify({query: search})}`);
    const data = await fetch(url, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({query: search})
    });

    const searchResults = (await data.json() ?? []);
    console.log("SEARCH SCRIPTURES LIKE");

    if (searchResults )
    console.log(JSON.stringify(searchResults));
    return <ScriptureModel[]>searchResults;
  }

  async getScripturesChapterMaxVerse(book:string, chapter:number): Promise<number> {
    console.log(`getting max verse of ${book}:${chapter}`);
    var url = `${this.ROOT_URL}scriptures/maxverse/book/${book}/chapter/${chapter}`;
    const data = await fetch(url);
    const result = (await data.json() ?? null);
    console.log("GET SCRIPTURES CHAPTER MAX VERSE");
    console.log(result.maxVerse);
    return +result.maxVerse;
  }

  async createCitation(description:string, parentTheme:number, scriptures:number[]): Promise<ThemeToCitationLinkModel> {
    console.log("createCitation");
    var url = `${this.ROOT_URL}citations`;
    let payload = {
      "themeId": parentTheme,
      "description": description,
      "scriptureIds": scriptures
    };

    console.log(payload);

    const data = await fetch (url, {
      method: "POST",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(payload)
    });

    const creationResults = (await data.json() ?? []);
    console.log("CREATE CITATION");

    if (creationResults)
      console.log(JSON.stringify(creationResults));

    return <ThemeToCitationLinkModel>creationResults;
  }
}

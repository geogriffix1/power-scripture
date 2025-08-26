import { Injectable } from "@angular/core";
import { Component } from "@angular/core";
import { ScriptureModel } from "./model/scripture.model";
import { ScriptureRangeModel } from "./model/scriptureRange.model";
import { 
  Bookmark,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  InternalHyperlink,
  Packer,
  PageBreak,
  PageReference,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType
} from "docx";
import { saveAs } from "file-saver";

@Injectable({
  providedIn: 'root'
})
export class DocxService {
  public searchScriptureReport(searchOption:string, scriptures:ScriptureModel[]) {
    const date = new Date();
    const filename = `Scripture Search Results ${date.getFullYear}-${date.getMonth()}-${date.getDay()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}}`;
    const scriptureRanges = this.getScriptureRanges(scriptures);
    this.reportScriptures(scriptureRanges);
    const doc = new Document({
      sections: [{
          children: [
            new Paragraph({
              text: 'Search Results',
              heading: HeadingLevel.TITLE
            }),
            new Paragraph({
              text: `${searchOption}`,
              heading: HeadingLevel.HEADING_2
            })
          ]
      }]
    });

    Packer.toBlob(doc).then(blob => {
      console.log(blob);
      saveAs("example.docx");
      console.log("document created successfully");
    });
  }

  public getScriptureRanges (scriptures:ScriptureModel[]):any[] {
    let scriptureRanges:ScriptureRangeModel[];
    let scriptureRange:ScriptureRangeModel;
    let book:string|undefined;
    let chapter:number|undefined;
    let startVerse:number|undefined;
    let endVerse: number|undefined;
    let verseList!:string[];

    scriptureRanges = [];
    for (let i = 0; i<scriptures.length; i++) {
      if (book && scriptures[i].book == book &&
        chapter && scriptures[i].chapter == chapter &&
        endVerse && scriptures[i].verse == endVerse + 1
      ) {
        endVerse ++;
        verseList.push(scriptures[i].text);
      }
      else {
        if (book) {
          let isSingleChapterBook = book.match(/Obadiah|Philemon|2 John|3 John|Jude/);
          let citation = isSingleChapterBook ? `${book} ${startVerse}` : `${book} ${chapter}:${startVerse}`;
          if (startVerse != endVerse) {
            citation = `${citation}-${endVerse}`;
          }

          scriptureRange = {
            citation: citation,
            verses: <any>[]
          };

          let index = 0;
          for (let verse = startVerse!; verse! <= endVerse!; verse!++) {
            scriptureRange.verses.push({
              verse: verse!,
              text: verseList[index++]
            });
          }

          scriptureRanges.push(scriptureRange);
        }

        book = scriptures[i].book;
        chapter = scriptures[i].chapter;
        startVerse = scriptures[i].verse;
        endVerse = startVerse;
        verseList = [];
        verseList.push(scriptures[i].text);
      }
    }

    if (book) {
      let isSingleChapterBook = book.match(/Obadiah|Philemon|2 John|3 John|Jude/);
      let citation = isSingleChapterBook ? `${book} ${startVerse}` : `${book} ${chapter}:${startVerse}`;
      if (startVerse != endVerse) {
        citation = `${citation}-${endVerse}`;
      }

      scriptureRange = {
        citation: citation,
        verses: <any>[]
      };

      let index = 0;
      for (let verse = startVerse!; verse! <= endVerse!; verse!++) {
        scriptureRange.verses.push({
          verse: verse!,
          text: verseList[index++]
        });
      }

      scriptureRanges.push(scriptureRange);
    }

    return scriptureRanges;
  }

  public reportScriptures(scriptureRanges:ScriptureRangeModel[]):Paragraph[] {
    for (let i=0; i < scriptureRanges.length; i++) {
      console.log(`citation: ${scriptureRanges[i].citation}`);
      for (let j=0; j < scriptureRanges[i]!.verses.length; j++) {
        let verse = scriptureRanges[i]!.verses[j];
        console.log(`verse ${verse.verse} ${verse.text}`);
      }
    }

    return [];
  }
}

import { ScriptureModel } from "../../model/scripture.model";
import { ScriptureRangeModel } from "../../model/scriptureRange.model";
import {
    AlignmentType,
    Document,
    HeadingLevel,
    Packer,
    Paragraph,
    TabStopPosition,
    TabStopType,
    Table,
    TableRow,
    TableCell,
    ITableCellOptions,
    TextRun,
    WidthType
  } from "docx";
   
  export class DocumentCreator {
    unicodeSuperscriptNumbers = [
      "\u2070",
      "\u00B9",
      "\u00B2",
      "\u00B3",
      "\u2074",
      "\u2075",
      "\u2076",
      "\u2077",
      "\u2078",
      "\u2079",
    ];
  
    public create(searchOption: string, scriptures: ScriptureModel[]): Document {
        let scriptureRanges = this.getScriptureRanges(scriptures);

        const table = new Table({
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  children: [
                    new Paragraph({
                      text: "Verse Range",
                      heading: HeadingLevel.HEADING_4,
                      alignment: "center"
                    })
                  ]
                }),
                new TableCell ({
                  children: [
                    new Paragraph({
                      text: "Scripture",
                      heading: HeadingLevel.HEADING_4,
                      alignment: "center"
                    })
                  ]
                })
              ]
            })
          ]
        })

        let dataRows = this.getTableRows(scriptureRanges);
        for (let r = 0; r<dataRows.length; r++) {
          table.addChildElement(dataRows[r]);
        }

        const document = new Document({
            sections: [{
                children: [
                    new Paragraph({
                      text: "Power Scripture",
                      heading: HeadingLevel.TITLE,
                      alignment: AlignmentType.CENTER
                    }),
                    new Paragraph({
                        text: `Scripture Search Results for: "${searchOption}"`,
                        heading: HeadingLevel.HEADING_1
                    }),
                    table
                ]
            }]
        });

        return document;
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

      public getTableRows(scriptureRanges:ScriptureRangeModel[]):TableRow[] {
        let tableRows = <TableRow[]>[];
        for (let i=0; i<scriptureRanges.length; i++) {
          let cells = <TableCell[]>[];
          cells.push(new TableCell({
            children: [
              new Paragraph({
                text: scriptureRanges[i].citation,
                heading: HeadingLevel.HEADING_6
              })
            ],
            width: {size: 16, type: WidthType.PERCENTAGE}
          }));
          
          let textRuns = <TextRun[]>[];
          let space = "";
          for (let j=0; j<scriptureRanges[i].verses.length; j++) {
            if (j > 0) {
              space = ` ${this.superscript(scriptureRanges[i].verses[j].verse)}`;
            }

            textRuns.push(new TextRun(
              space + scriptureRanges[i].verses[j].text
            ));
          }

          let p = new Paragraph({
            children: textRuns
          });

          cells.push(new TableCell({
            children: [ p ]
          }));

          tableRows.push(new TableRow({
            children: cells
          }));
        }

        return tableRows;
      }

      public superscript(n:number): string {
        let s = n.toString();
        let ss = "";
        for (let i=0; i<s.length; i++) {
          let c = s.charCodeAt(i) - "0".charCodeAt(0);
          ss += this.unicodeSuperscriptNumbers[c];
        }

        return ss;
      }
    }

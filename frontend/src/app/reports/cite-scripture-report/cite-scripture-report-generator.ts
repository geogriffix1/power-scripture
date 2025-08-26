import { CiteScriptureRangeModel } from "../../model/citeScriptureRangeModel";
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
   
  export class CitationDocumentCreator {
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
  
    public create(scriptures: CiteScriptureRangeModel[]): Document {
        let scriptureRanges = scriptures;

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
                        text: `Scripture Citations`,
                        heading: HeadingLevel.HEADING_1
                    }),
                    table
                ]
            }]
        });

        return document;
    }

      public getTableRows(scriptureRanges:CiteScriptureRangeModel[]):TableRow[] {
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

          let p = new Paragraph({
            children: [new TextRun(scriptureRanges[i].verses)]
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

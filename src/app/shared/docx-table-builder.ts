// ===================================================================
// DOCX Report Table Builder - Reusable Helper Class
// ===================================================================

import {
  Table,
  TableCell,
  TableRow,
  Paragraph,
  TextRun,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ShadingType
} from 'docx';

/**
 * Helper class for building styled DOCX tables for reports
 */
export class DOCXTableBuilder {

  /**
   * Create a styled header cell with blue background and white text
   */
  static headerCell(text: string, bold = true): TableCell {
    return new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, bold, color: 'FFFFFF' })],
        alignment: AlignmentType.CENTER,
      })],
      shading: {
        fill: '2196F3',  // Blue background
        type: ShadingType.SOLID,
      },
    });
  }

  /**
   * Create a regular data cell
   */
  static dataCell(text: string | number, align = AlignmentType.LEFT): TableCell {
    return new TableCell({
      children: [new Paragraph({
        text: text?.toString() || '-',
        alignment: align,
      })],
    });
  }

  /**
   * Create a total/footer cell with gray background and bold text
   */
  static totalCell(text: string | number, align = AlignmentType.RIGHT): TableCell {
    return new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: text?.toString() || '0', bold: true })],
        alignment: align,
      })],
      shading: {
        fill: 'F0F0F0',  // Light gray background
        type: ShadingType.SOLID,
      },
    });
  }

  /**
   * Create FIU Activities Table
   * Columns: Sl. No. | Activity | No.
   */
  static createFIUTable(activities: any[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header row
        new TableRow({
          children: [
            this.headerCell('Sl. No.'),
            this.headerCell('Activity'),
            this.headerCell('No.'),
          ],
        }),
        // Data rows
        ...activities.map(a => new TableRow({
          children: [
            this.dataCell(a.slNo, AlignmentType.CENTER),
            this.dataCell(a.activityName, AlignmentType.LEFT),
            this.dataCell(a.count, AlignmentType.CENTER),
          ],
        })),
        // Total row
        new TableRow({
          children: [
            this.totalCell('', AlignmentType.CENTER),
            this.totalCell('TOTAL', AlignmentType.RIGHT),
            this.totalCell(activities.reduce((sum, a) => sum + a.count, 0), AlignmentType.CENTER),
          ],
        }),
      ],
    });
  }

  /**
   * Create ASM Visitor Statistics Table
   * Columns: Sl. No. | Particulars | No. of visitors
   */
  static createASMTable(visitors: any[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header row
        new TableRow({
          children: [
            this.headerCell('Sl. No.'),
            this.headerCell('Particulars'),
            this.headerCell('No. of visitors'),
          ],
        }),
        // Data rows
        ...visitors.map(v => new TableRow({
          children: [
            this.dataCell(v.slNo, AlignmentType.CENTER),
            this.dataCell(v.particulars, AlignmentType.LEFT),
            this.dataCell(v.noOfVisitors, AlignmentType.CENTER),
          ],
        })),
        // Total row
        new TableRow({
          children: [
            this.totalCell('', AlignmentType.CENTER),
            this.totalCell('Total', AlignmentType.RIGHT),
            this.totalCell(visitors.reduce((sum, v) => sum + v.noOfVisitors, 0), AlignmentType.CENTER),
          ],
        }),
      ],
    });
  }

  /**
   * Create Programs Table
   * Columns: Type | Title | Date From | Date To | Duration | Participants | Status
   */
  static createProgramsTable(programs: any[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        // Header row
        new TableRow({
          children: [
            this.headerCell('Type'),
            this.headerCell('Title'),
            this.headerCell('Date From'),
            this.headerCell('Date To'),
            this.headerCell('Duration'),
            this.headerCell('Participants'),
            this.headerCell('Status'),
          ],
        }),
        // Data rows
        ...programs.map(p => new TableRow({
          children: [
            this.dataCell(p.programType || '-'),
            this.dataCell(p.title || '-'),
            this.dataCell(p.dateFrom || '-', AlignmentType.CENTER),
            this.dataCell(p.dateTo || '-', AlignmentType.CENTER),
            this.dataCell(p.duration || '-', AlignmentType.CENTER),
            this.dataCell(p.participants || '-', AlignmentType.CENTER),
            this.dataCell(p.status || '-', AlignmentType.CENTER),
          ],
        })),
      ],
    });
  }

  /**
   * Create Publications Table
   * Columns: Category | Title | Pages
   */
  static createPublicationsTable(publications: any[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            this.headerCell('Category'),
            this.headerCell('Title'),
            this.headerCell('Pages'),
          ],
        }),
        ...publications.map(p => new TableRow({
          children: [
            this.dataCell(p.category || '-'),
            this.dataCell(p.title || '-'),
            this.dataCell(p.pages || '-', AlignmentType.CENTER),
          ],
        })),
      ],
    });
  }

  /**
   * Create Nominations Table
   * Columns: Type | Award Name | Category | Date
   */
  static createNominationsTable(nominations: any[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            this.headerCell('Type'),
            this.headerCell('Award Name'),
            this.headerCell('Category'),
            this.headerCell('Date'),
          ],
        }),
        ...nominations.map(n => new TableRow({
          children: [
            this.dataCell(n.type || '-'),
            this.dataCell(n.awardName || '-'),
            this.dataCell(n.category || '-'),
            this.dataCell(n.date || '-', AlignmentType.CENTER),
          ],
        })),
      ],
    });
  }

  /**
   * Create Consultancies Table
   * Columns: Category | Title | Date
   */
  static createConsultanciesTable(consultancies: any[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            this.headerCell('Category'),
            this.headerCell('Title'),
            this.headerCell('Date'),
          ],
        }),
        ...consultancies.map(c => new TableRow({
          children: [
            this.dataCell(c.category || '-'),
            this.dataCell(c.title || '-'),
            this.dataCell(c.date || '-', AlignmentType.CENTER),
          ],
        })),
      ],
    });
  }

  /**
   * Create Services Table
   * Columns: Category | Title | Theme | Unit | Quantity | Amount
   */
  static createServicesTable(services: any[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            this.headerCell('Category'),
            this.headerCell('Title'),
            this.headerCell('Theme'),
            this.headerCell('Unit'),
            this.headerCell('Quantity'),
            this.headerCell('Amount'),
          ],
        }),
        ...services.map(s => new TableRow({
          children: [
            this.dataCell(s.category || '-'),
            this.dataCell(s.title || '-'),
            this.dataCell(s.theme || '-'),
            this.dataCell(s.unit || '-'),
            this.dataCell(s.quantity || '-', AlignmentType.CENTER),
            this.dataCell(s.amount ? `₹${s.amount.toFixed(2)}` : '-', AlignmentType.RIGHT),
          ],
        })),
      ],
    });
  }

  /**
   * Create Other Activities Table
   * Columns: Sl.No | Title | Description
   */
  static createOtherActivitiesTable(activities: any[]): Table {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            this.headerCell('Sl.No'),
            this.headerCell('Title'),
            this.headerCell('Description'),
          ],
        }),
        ...activities.map((a, i) => new TableRow({
          children: [
            this.dataCell(i + 1, AlignmentType.CENTER),
            this.dataCell(a.title || '-'),
            this.dataCell(a.description || '-'),
          ],
        })),
      ],
    });
  }

  /**
   * Create section heading paragraph
   */
  static sectionHeading(text: string): Paragraph {
    return new Paragraph({
      text,
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 400, after: 200 },
    });
  }

  /**
   * Create empty line for spacing
   */
  static emptyLine(): Paragraph {
    return new Paragraph({ text: '' });
  }
}

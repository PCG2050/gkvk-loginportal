# GKVK Login Portal - Report Generation System Documentation

**Version:** 1.0
**Last Updated:** December 19, 2024
**Author:** System Analysis & Documentation

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Implementation Overview](#current-implementation-overview)
3. [Legacy Report System](#legacy-report-system)
4. [Dynamic Report System](#dynamic-report-system)
5. [DOCXTableBuilder Analysis](#docxtablebuilder-analysis)
6. [Current Report Structure by Unit Type](#current-report-structure-by-unit-type)
7. [Gap Analysis: Dynamic Report DOCX Generation](#gap-analysis-dynamic-report-docx-generation)
8. [Implementation Roadmap](#implementation-roadmap)
9. [Recommendations & Best Practices](#recommendations--best-practices)

---

## Executive Summary

The GKVK Login Portal currently implements **two parallel report generation systems**:

1. **Legacy System** - Fixed report structure with DOCX download capability
2. **Dynamic System** - Configurable sections/columns with HTML preview (❌ **NO DOCX DOWNLOAD**)

### Key Findings

| Feature | Legacy System | Dynamic System |
|---------|--------------|----------------|
| **Configuration** | Fixed structure | User-configurable sections & columns |
| **HTML Preview** | ✅ Yes | ✅ Yes |
| **DOCX Download** | ✅ Yes | ❌ **MISSING** |
| **Flexibility** | Low | High |
| **API Endpoints** | 1 endpoint | 2 endpoints (config + generate) |
| **Unit Types Supported** | FIU, ASM, Regular | All units (generic) |

### Critical Gap

**The dynamic report system lacks DOCX download functionality**, which means:
- Users can configure and preview reports dynamically
- BUT they cannot download the customized report as a DOCX file
- The download button in the UI calls the legacy `downloadDOCX()` method which only works with `reportData` (legacy), not `dynamicReportData`

---

## Current Implementation Overview

### File Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/
│   │   │   └── dynamic-report.models.ts          # Dynamic report type definitions
│   │   └── services/
│   │       └── layout.service.ts                 # Sidebar state management
│   ├── pages/
│   │   └── reports/
│   │       ├── reports.component.ts              # Main report component
│   │       ├── reports.component.html            # Report UI template
│   │       ├── reports.component.css             # Report styling
│   │       └── report-config-modal/              # Configuration modal
│   │           └── report-config-modal/
│   │               ├── report-config-modal.component.ts
│   │               ├── report-config-modal.component.html
│   │               └── report-config-modal.component.css
│   └── shared/
│       ├── endpoints.model.ts                    # API endpoint definitions
│       └── docx-table-builder.ts                 # DOCX table utility class
```

### Technology Stack

| Component | Technology |
|-----------|-----------|
| Framework | Angular 19.2.0 |
| DOCX Generation | `docx@9.5.1` |
| File Download | `file-saver@2.0.5` |
| HTTP Client | Angular HttpClient |
| State Management | Angular Signals |

---

## Legacy Report System

### Overview

The legacy system generates **fixed-structure reports** based on unit type with full DOCX download support.

### Data Flow

```
User Selects Filters (Unit/Location/Month/Year)
    ↓
Click "Generate Report"
    ↓
POST /api/admin/reports/generate
    ↓
Receive ReportData (fixed structure)
    ↓
Display HTML Preview
    ↓
Click "Download DOCX"
    ↓
downloadDOCX() method
    ↓
Build DOCX using DOCXTableBuilder
    ↓
Download file
```

### API Endpoint

```typescript
Endpoint: POST /api/admin/reports/generate
Base URL: https://gkvk-qaenv.azurewebsites.net

Request Body:
{
  "unitLocationId": number,
  "month": number,
  "year": number
}

Response: ReportData (see data model below)
```

### Data Models

**ReportData Interface:**
```typescript
interface ReportData {
  unitName: string;
  unitLocationName: string;
  monthName: string;
  month: number;
  year: number;
  generatedAt: string;
  totalEntries: number;

  // Regular unit sections
  programs: any[];
  publications: any[];
  nominations: any[];
  consultancies: any[];
  services: any[];
  otherActivities: any[];

  // FIU-specific (optional)
  fiuActivities?: {
    activities: FIUActivity[];
    totalActivities: number;
    totalCount: number;
    totalEntries: number;
  };

  // ASM-specific (optional)
  asmActivities?: {
    visitors: ASMVisitor[];
    totalVisitors: number;
    totalEntries: number;
  };
}
```

### DOCX Generation Process

**File:** `src/app/pages/reports/reports.component.ts` (lines 466-640)

**Method:** `async downloadDOCX()`

**Steps:**
1. **Create Document Header**
   - Title: "Administrative Report"
   - Unit name, location, month/year
   - Generation timestamp
   - Total approved entries

2. **Determine Unit Type**
   - FIU Unit (ID = 3)
   - ASM Unit (ID = 7)
   - Regular Unit (all others)

3. **Build Sections Based on Unit Type**
   - FIU: FIU Activities + Other Activities
   - ASM: ASM Visitor Statistics + Other Activities
   - Regular: Programs, Publications, Nominations, Consultancies, Services, Other Activities

4. **Create DOCX Document**
   - Set page margins (0.5 inch)
   - Add header paragraphs
   - Add section headings and tables
   - Add spacing between sections

5. **Pack and Download**
   - Convert to blob
   - Generate filename: `[Type]_Report_[Unit]_[Month]_[Year].docx`
   - Trigger download

### Limitations

❌ Fixed structure - no customization
❌ All-or-nothing sections
❌ Cannot select specific columns
❌ Unit-type dependent logic

---

## Dynamic Report System

### Overview

The dynamic system allows users to **configure which sections and columns** appear in their report through an interactive modal interface.

### Data Flow

```
User Selects Unit
    ↓
GET /api/admin/reports/dynamic/configuration?unitId={id}
    ↓
Receive ReportConfiguration (available sections & columns)
    ↓
Auto-select default sections
    ↓
User Opens Configuration Modal
    ↓
User Selects/Deselects Sections
User Toggles Columns per Section
    ↓
Click "Generate" or "Preview"
    ↓
POST /api/admin/reports/dynamic/generate
    ↓
Receive DynamicReportData (custom sections)
    ↓
Display HTML Preview with selected sections
    ↓
❌ DOCX Download NOT AVAILABLE
```

### API Endpoints

**Configuration Endpoint:**
```typescript
Endpoint: GET /api/admin/reports/dynamic/configuration
Base URL: https://gkvk-qaenv.azurewebsites.net

Query Parameters:
  - unitId: number

Response: ReportConfiguration
{
  "availableSections": SectionDefinition[],
  "defaultSections": string[]
}
```

**Generation Endpoint:**
```typescript
Endpoint: POST /api/admin/reports/dynamic/generate
Base URL: https://gkvk-qaenv.azurewebsites.net

Request Body: DynamicReportRequest
{
  "unitLocationId": number,
  "month": number,
  "year": number,
  "sections": [
    {
      "sectionKey": string,
      "selectedColumns": string[],
      "sortBy": string (optional),
      "sortDirection": "asc" | "desc" (optional)
    }
  ]
}

Response: DynamicReportData
{
  "unitName": string,
  "unitLocationName": string,
  "monthName": string,
  "month": number,
  "year": number,
  "generatedAt": string,
  "totalEntries": number,
  "sections": ReportSection[]
}
```

### Data Models

**Complete Type Definitions** (`src/app/core/models/dynamic-report.models.ts`):

```typescript
// Configuration Models
export interface ReportConfiguration {
  availableSections: SectionDefinition[];
  defaultSections: string[];
}

export interface SectionDefinition {
  sectionKey: string;
  displayName: string;
  icon?: string;
  availableColumns: ColumnDefinition[];
  defaultColumns: string[];
  isAvailable: boolean;
  group?: string;
}

export interface ColumnDefinition {
  key: string;
  displayName: string;
  dataType: string;
  defaultSelected: boolean;
  group?: string;
  isFilterable: boolean;
  isSortable: boolean;
  width?: number;
}

// Request Models
export interface DynamicReportRequest {
  unitLocationId: number;
  month: number;
  year: number;
  sections: SectionRequest[];
  outputFormat?: string;
}

export interface SectionRequest {
  sectionKey: string;
  selectedColumns: string[];
  sortBy?: string;
  sortDirection?: string;
}

// Response Models
export interface DynamicReportData {
  unitName: string;
  unitLocationName: string;
  monthName: string;
  month: number;
  year: number;
  generatedAt: string;
  totalEntries: number;
  sections: ReportSection[];
}

export interface ReportSection {
  sectionKey: string;
  displayName: string;
  totalRecords: number;
  columns: ColumnMetadata[];
  rows: Record<string, any>[];
  cssClass?: string;
  showTotal?: boolean;
  totalValue?: number;
}

export interface ColumnMetadata {
  key: string;
  displayName: string;
  dataType: string;
  width?: number;
}
```

### Report Configuration Modal

**Component:** `report-config-modal.component.ts`

**Features:**
- **Two-Panel Layout**
  - Left Panel (350px): Section selection with column counts
  - Right Panel (flex): Column configuration for active section

- **Section Management**
  - Checkbox to include/exclude section
  - Configure button to edit columns
  - Active section highlighting
  - Column count display (e.g., "5/12 columns")

- **Column Management**
  - Search functionality
  - Select All / Reset to Defaults buttons
  - Minimum 1 column required per section
  - Data type badges (string, number, date, etc.)
  - Default column indicators

- **Modal Actions**
  - **Cancel:** Close without changes
  - **Preview:** Generate report keeping modal open
  - **Generate:** Generate final report and close modal

**Key Methods:**
```typescript
toggleSection(section: SectionDefinition)
toggleColumn(sectionKey: string, columnKey: string)
selectAllColumns(sectionKey: string)
resetToDefaults(sectionKey: string)
onPreview() // Emits to parent
onGenerate() // Emits to parent
```

### Preview Mode

When preview button is clicked:
```typescript
onPreviewReport(sections: Map<string, SectionRequest>) {
  this.selectedSections = sections;
  this.isPreviewMode = true;  // Shows "PREVIEW MODE" badge
  this.generateDynamicReport();
  // Modal stays open for further adjustments
}
```

When generate button is clicked:
```typescript
onGenerateReport(sections: Map<string, SectionRequest>) {
  this.selectedSections = sections;
  this.isPreviewMode = false;
  this.generateDynamicReport();
  this.closeConfigModal();  // Closes modal
  this.layoutService.restoreSidebarAfterModal();  // Restores sidebar
}
```

### Data Formatting

**File:** `reports.component.ts` (lines 381-405)

```typescript
formatCellValue(value: any, dataType: string): string {
  if (value === null || value === undefined) return '-';

  switch (dataType.toLowerCase()) {
    case 'date':
    case 'datetime':
      return new Date(value).toLocaleDateString();

    case 'number':
    case 'int':
    case 'integer':
      return value.toString();

    case 'decimal':
    case 'float':
    case 'double':
      return parseFloat(value).toFixed(2);

    case 'currency':
      return new Intl.NumberFormat('en-IN',
        { style: 'currency', currency: 'INR' }
      ).format(value);

    case 'boolean':
      return value ? 'Yes' : 'No';

    default:
      return value.toString();
  }
}
```

### Limitations

❌ **No DOCX download functionality**
❌ Only HTML preview available
❌ Cannot export customized report structure
❌ Download button uses legacy method (incompatible)

---

## DOCXTableBuilder Analysis

### Overview

`DOCXTableBuilder` is a **static utility class** that provides reusable methods for creating formatted DOCX tables using the `docx` library.

**File:** `src/app/shared/docx-table-builder.ts` (335 lines)

### Architecture

**Design Pattern:** Static Utility Class (no instantiation required)

**Methods Count:** 11 static methods
- 3 Cell formatting methods
- 8 Table generation methods

### Cell Formatting Methods

#### 1. `headerCell(text: string, bold = true): TableCell`

**Purpose:** Create header cells with blue background

**Styling:**
- Background: #2196F3 (blue)
- Text Color: #FFFFFF (white)
- Alignment: CENTER
- Font Weight: Bold (default)

**Usage:**
```typescript
DOCXTableBuilder.headerCell('Column Name')
```

**Current Implementation:**
```typescript
static headerCell(text: string, bold = true): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, bold, color: 'FFFFFF' })],
      alignment: AlignmentType.CENTER,
    })],
    shading: {
      fill: '2196F3',
      type: ShadingType.SOLID,
    },
  });
}
```

#### 2. `dataCell(text: string | number, align = AlignmentType.LEFT): TableCell`

**Purpose:** Create standard data cells

**Styling:**
- Background: White (default)
- Text Color: Black (default)
- Alignment: Configurable (default LEFT)
- Null Handling: Shows "-" for null/undefined

**Usage:**
```typescript
DOCXTableBuilder.dataCell(value, AlignmentType.CENTER)
```

#### 3. `totalCell(text: string | number, align = AlignmentType.RIGHT): TableCell`

**Purpose:** Create total/footer cells

**Styling:**
- Background: #F0F0F0 (light gray)
- Text Color: Black
- Font Weight: Bold
- Alignment: Configurable (default RIGHT)

**Usage:**
```typescript
DOCXTableBuilder.totalCell('TOTAL', AlignmentType.RIGHT)
```

### Table Generation Methods

#### Summary Table

| Method | Columns | Has Total Row | Special Features |
|--------|---------|---------------|------------------|
| `createFIUTable()` | 3 | ✅ Yes (sum of counts) | FIU-specific activities |
| `createASMTable()` | 3 | ✅ Yes (sum of visitors) | ASM-specific visitors |
| `createProgramsTable()` | 8 | ❌ No | Most columns (8) |
| `createPublicationsTable()` | 4 | ❌ No | Simple structure |
| `createNominationsTable()` | 5 | ❌ No | Award tracking |
| `createConsultanciesTable()` | 4 | ❌ No | Simple structure |
| `createServicesTable()` | 7 | ❌ No | Currency formatting (₹) |
| `createOtherActivitiesTable()` | 3 | ❌ No | Generic activities |

#### Detailed Analysis

**1. createFIUTable(activities: any[])**
```typescript
Columns: Sl. No. | Activity | No.
Total Row: Automatic sum of all counts
Data Access: activities[].slNo, activityName, count
```

**2. createASMTable(visitors: any[])**
```typescript
Columns: Sl. No. | Particulars | No. of visitors
Total Row: Automatic sum of all visitors
Data Access: visitors[].slNo, particulars, noOfVisitors
```

**3. createProgramsTable(programs: any[])**
```typescript
Columns: Sl.No | Type | Title | Date From | Date To | Duration | Participants | Status
Total Row: None
Data Access: programs[].programType, title, dateFrom, dateTo, duration, participants, status
Note: Most complex table with 8 columns
```

**4. createPublicationsTable(publications: any[])**
```typescript
Columns: Sl.No | Category | Title | Pages
Total Row: None
Data Access: publications[].category, title, pages
```

**5. createNominationsTable(nominations: any[])**
```typescript
Columns: Sl.No | Type | Award Name | Category | Date
Total Row: None
Data Access: nominations[].type, awardName, category, date
```

**6. createConsultanciesTable(consultancies: any[])**
```typescript
Columns: Sl.No | Category | Title | Date
Total Row: None
Data Access: consultancies[].category, title, date
```

**7. createServicesTable(services: any[])**
```typescript
Columns: Sl.No | Category | Title | Theme | Unit | Quantity | Amount
Total Row: None
Currency Formatting: ₹{amount.toFixed(2)}
Data Access: services[].category, title, theme, unit, quantity, amount
Note: Special currency formatting for Amount column
```

**8. createOtherActivitiesTable(activities: any[])**
```typescript
Columns: Sl.No | Title | Description
Total Row: None
Data Access: activities[].title, description
```

### Helper Methods

**sectionHeading(text: string): Paragraph**
- Creates HEADING_2 level paragraph
- Spacing: 400 before, 200 after
- Used for section titles

**emptyLine(): Paragraph**
- Creates blank paragraph
- Used for spacing between sections

### Current Limitations & Issues

#### ❌ **Hard-Coded Table Structures**
- Each table method is tightly coupled to specific data structures
- Field names are hard-coded (e.g., `p.programType`, `s.category`)
- Cannot handle dynamic column configurations

#### ❌ **No Dynamic Column Support**
- Cannot add/remove columns at runtime
- Cannot change column order
- Cannot customize column headers

#### ❌ **Limited Flexibility**
- Only works with predefined table types
- Cannot create custom table structures
- No configuration options

#### ❌ **Repetitive Code**
- Similar logic duplicated across methods
- No shared base table creation logic
- Hard to maintain

#### ❌ **No Data Type Handling**
- No automatic formatting based on data type
- Currency formatting only in Services table
- No date formatting utilities

#### ❌ **Missing Features**
- No column width configuration
- No row styling options
- No conditional formatting
- No merged cells support
- No alternating row colors

---

## Current Report Structure by Unit Type

### Unit Type Classification

**Unit Type Detection Logic:**
```typescript
// Constants
readonly FIU_UNIT_ID = 3;
readonly ASM_UNIT_ID = 7;

// Detection
isFIUUnit = this.selectedUnit === this.FIU_UNIT_ID;
isASMUnit = this.selectedUnit === this.ASM_UNIT_ID;

// Also verified from response data
this.isFIUUnit = !!(data.fiuActivities && data.fiuActivities.activities.length > 0);
this.isASMUnit = !!(data.asmActivities && data.asmActivities.visitors && data.asmActivities.visitors.length > 0);
```

### FIU Unit Report Structure

**Unit Type:** Financial Intelligence Unit (ID = 3)

**Document Structure:**
```
Administrative Report
Unit Name: [FIU Unit Name]
Location: [Unit Location]
Period: [Month Year]
Generated: [Timestamp]
Total Entries: [Count]

═══════════════════════════════════════

SECTION 1: FIU MEDIA ACTIVITIES
Total: [Total Count]

┌─────────┬────────────────────────────┬──────┐
│ Sl. No. │         Activity           │  No. │
├─────────┼────────────────────────────┼──────┤
│    1    │ Newspaper Articles         │  15  │
│    2    │ TV Interviews              │   8  │
│    3    │ Radio Broadcasts           │  12  │
│   ...   │          ...               │ ...  │
├─────────┼────────────────────────────┼──────┤
│         │          TOTAL             │  45  │
└─────────┴────────────────────────────┴──────┘

═══════════════════════════════════════

SECTION 2: OTHER ACTIVITIES (optional)
Total: [Count]

┌─────────┬────────────────────────────┬──────────────┐
│ Sl.No   │          Title             │ Description  │
├─────────┼────────────────────────────┼──────────────┤
│    1    │ Community Outreach         │ [Details...] │
│   ...   │          ...               │     ...      │
└─────────┴────────────────────────────┴──────────────┘
```

**Key Characteristics:**
- Focuses on media activities
- Auto-calculates total count
- Minimal structure (1-2 sections)
- Specialized for communication/outreach tracking

### ASM Unit Report Structure

**Unit Type:** Agricultural Statistics/Services Unit (ID = 7)

**Document Structure:**
```
Administrative Report
Unit Name: [ASM Unit Name]
Location: [Unit Location]
Period: [Month Year]
Generated: [Timestamp]
Total Entries: [Count]

═══════════════════════════════════════

SECTION 1: ASM VISITOR STATISTICS
Total Visitors: [Total Count]

┌─────────┬────────────────────────────┬──────────────────┐
│ Sl. No. │       Particulars          │ No. of Visitors  │
├─────────┼────────────────────────────┼──────────────────┤
│    1    │ Farmers                    │       150        │
│    2    │ Students                   │        85        │
│    3    │ Researchers                │        42        │
│   ...   │          ...               │       ...        │
├─────────┼────────────────────────────┼──────────────────┤
│         │          Total             │       365        │
└─────────┴────────────────────────────┴──────────────────┘

═══════════════════════════════════════

SECTION 2: OTHER ACTIVITIES (optional)
Total: [Count]

┌─────────┬────────────────────────────┬──────────────┐
│ Sl.No   │          Title             │ Description  │
├─────────┼────────────────────────────┼──────────────┤
│    1    │ Field Demonstrations       │ [Details...] │
│   ...   │          ...               │     ...      │
└─────────┴────────────────────────────┴──────────────┘
```

**Key Characteristics:**
- Visitor tracking focus
- Categorized visitor types
- Auto-calculates total visitors
- Service-oriented metrics

### Regular Unit Report Structure

**Unit Type:** All other units (Research, Extension, Training, etc.)

**Document Structure:**
```
Administrative Report
Unit Name: [Unit Name]
Location: [Unit Location]
Period: [Month Year]
Generated: [Timestamp]
Total Entries: [Count]

═══════════════════════════════════════

SECTION 1: PROGRAMS
Total: [Count]

┌────┬──────┬───────┬───────────┬─────────┬──────────┬──────────────┬────────┐
│ No │ Type │ Title │ Date From │ Date To │ Duration │ Participants │ Status │
├────┼──────┼───────┼───────────┼─────────┼──────────┼──────────────┼────────┤
│  1 │ ... │  ...  │    ...    │   ...   │   ...    │     ...      │  ...   │
└────┴──────┴───────┴───────────┴─────────┴──────────┴──────────────┴────────┘

═══════════════════════════════════════

SECTION 2: PUBLICATIONS
Total: [Count]

┌────┬──────────┬───────────────────────┬───────┐
│ No │ Category │         Title         │ Pages │
├────┼──────────┼───────────────────────┼───────┤
│  1 │   ...    │         ...           │  ...  │
└────┴──────────┴───────────────────────┴───────┘

═══════════════════════════════════════

SECTION 3: NOMINATION & REWARDS
Total: [Count]

┌────┬──────┬────────────┬──────────┬──────┐
│ No │ Type │ Award Name │ Category │ Date │
├────┼──────┼────────────┼──────────┼──────┤
│  1 │ ... │    ...     │   ...    │ ...  │
└────┴──────┴────────────┴──────────┴──────┘

═══════════════════════════════════════

SECTION 4: CONSULTANCY SERVICES
Total: [Count]

┌────┬──────────┬───────┬──────┐
│ No │ Category │ Title │ Date │
├────┼──────────┼───────┼──────┤
│  1 │   ...    │  ...  │ ...  │
└────┴──────────┴───────┴──────┘

═══════════════════════════════════════

SECTION 5: SERVICES / FACILITIES
Total: [Count]

┌────┬──────────┬───────┬───────┬──────┬──────────┬─────────┐
│ No │ Category │ Title │ Theme │ Unit │ Quantity │  Amount │
├────┼──────────┼───────┼───────┼──────┼──────────┼─────────┤
│  1 │   ...    │  ...  │  ...  │ ... │   ...    │ ₹123.45 │
└────┴──────────┴───────┴───────┴──────┴──────────┴─────────┘

═══════════════════════════════════════

SECTION 6: OTHER ACTIVITIES
Total: [Count]

┌────┬────────────────┬─────────────────────┐
│ No │     Title      │     Description     │
├────┼────────────────┼─────────────────────┤
│  1 │      ...       │        ...          │
└────┴────────────────┴─────────────────────┘
```

**Key Characteristics:**
- Comprehensive 6-section structure
- Covers all research/academic activities
- Most detailed report type
- Supports diverse activity types

### Section Comparison Matrix

| Section | FIU Unit | ASM Unit | Regular Units |
|---------|----------|----------|---------------|
| **Media Activities** | ✅ Primary | ❌ | ❌ |
| **Visitor Statistics** | ❌ | ✅ Primary | ❌ |
| **Programs** | ❌ | ❌ | ✅ |
| **Publications** | ❌ | ❌ | ✅ |
| **Nominations** | ❌ | ❌ | ✅ |
| **Consultancies** | ❌ | ❌ | ✅ |
| **Services** | ❌ | ❌ | ✅ |
| **Other Activities** | ✅ Optional | ✅ Optional | ✅ |

---

## Gap Analysis: Dynamic Report DOCX Generation

### Current State vs. Desired State

| Aspect | Current State | Desired State |
|--------|---------------|---------------|
| **Configuration** | ✅ User can select sections & columns | ✅ Same |
| **HTML Preview** | ✅ Dynamic sections displayed | ✅ Same |
| **DOCX Download** | ❌ Only legacy reports | ✅ Dynamic reports too |
| **Table Generation** | ❌ Fixed structure only | ✅ Dynamic columns |
| **Flexibility** | ❌ Hard-coded tables | ✅ Configurable tables |

### Technical Challenges

#### Challenge 1: Incompatible Data Structures

**Problem:**
```typescript
// Legacy downloadDOCX() expects:
if (!this.reportData) return;  // ❌ Checks wrong property

// But dynamic reports use:
if (!this.dynamicReportData) return;  // Should check this instead
```

**Impact:** Download button doesn't work for dynamic reports

---

#### Challenge 2: Hard-Coded Table Builders

**Problem:**
```typescript
// Current DOCXTableBuilder methods are hard-coded:
DOCXTableBuilder.createProgramsTable(programs: any[]): Table {
  // Fixed columns: Type, Title, Date From, Date To, Duration, Participants, Status
}

// Dynamic reports need flexible columns:
dynamicReportData.sections[0].columns = [
  { key: 'title', displayName: 'Program Title', dataType: 'string' },
  { key: 'date', displayName: 'Date', dataType: 'date' }
  // User-selected columns - can vary!
]
```

**Impact:** Cannot reuse existing table builders for dynamic data

---

#### Challenge 3: No Dynamic Column Support

**Problem:**
```typescript
// DOCXTableBuilder cannot handle:
- Variable number of columns
- Dynamic column headers
- Custom column configurations
- Different data types per column
```

**Impact:** Need new table generation approach

---

#### Challenge 4: Data Type Formatting

**Problem:**
```typescript
// Legacy tables have hard-coded formatting:
static createServicesTable(services) {
  this.dataCell(s.amount ? `₹${s.amount.toFixed(2)}` : '-', AlignmentType.RIGHT)
}

// Dynamic reports need generic data type handling:
formatCellValue(value: any, dataType: string): string {
  switch (dataType.toLowerCase()) {
    case 'currency': return new Intl.NumberFormat('en-IN', {style: 'currency', currency: 'INR'}).format(value);
    case 'date': return new Date(value).toLocaleDateString();
    // etc.
  }
}
```

**Impact:** Need to integrate formatCellValue() with DOCX generation

---

### Root Cause Analysis

```
ROOT CAUSE: Tight Coupling Between Data Structure and Presentation

Legacy System:
  Data Structure (ReportData)
      ↓ Hard-coded field names
  Table Builders (createXTable)
      ↓ Fixed columns
  DOCX Output

Dynamic System:
  Data Structure (DynamicReportData)
      ↓ Generic sections array
  ??? Missing Layer ???
      ↓ Should be flexible
  DOCX Output (Not implemented)
```

**The Missing Piece:** A generic table builder that can:
1. Accept any column configuration
2. Handle any data type
3. Format cells based on column metadata
4. Generate tables dynamically

---

## Implementation Roadmap

### Phase 1: Create Generic DOCX Table Builder

**Goal:** Build a flexible table generation method that works with dynamic data

**New Method to Add:**
```typescript
/**
 * Create a dynamic table from generic section data
 * @param section - ReportSection with columns and rows
 * @returns Table - Formatted DOCX table
 */
static createDynamicTable(section: ReportSection): Table {
  // Implementation details in Phase 1 below
}
```

**Implementation Steps:**

**Step 1.1: Add Import for ReportSection**
```typescript
// File: src/app/shared/docx-table-builder.ts

import { ReportSection, ColumnMetadata } from '../core/models/dynamic-report.models';
```

**Step 1.2: Implement Dynamic Table Method**
```typescript
static createDynamicTable(section: ReportSection, formatCellFn: (value: any, dataType: string) => string): Table {
  const headerCells = [
    this.headerCell('Sl.No'),
    ...section.columns.map(col => this.headerCell(col.displayName))
  ];

  const dataRows = section.rows.map((row, index) => {
    const cells = [
      this.dataCell(index + 1, AlignmentType.CENTER),
      ...section.columns.map(col => {
        const value = row[col.key];
        const formattedValue = formatCellFn(value, col.dataType);
        const alignment = this.getAlignmentForDataType(col.dataType);
        return this.dataCell(formattedValue, alignment);
      })
    ];

    return new TableRow({ children: cells });
  });

  const rows = [
    new TableRow({ children: headerCells }),
    ...dataRows
  ];

  // Add total row if needed
  if (section.showTotal && section.totalValue !== null) {
    const totalCells = [
      this.totalCell('', AlignmentType.CENTER),
      this.totalCell('TOTAL', AlignmentType.RIGHT, section.columns.length - 1),
      this.totalCell(section.totalValue, AlignmentType.CENTER)
    ];
    rows.push(new TableRow({ children: totalCells }));
  }

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows
  });
}
```

**Step 1.3: Add Helper Method for Data Type Alignment**
```typescript
/**
 * Get appropriate alignment based on data type
 */
static getAlignmentForDataType(dataType: string): any {
  switch (dataType.toLowerCase()) {
    case 'number':
    case 'int':
    case 'integer':
    case 'decimal':
    case 'float':
    case 'double':
    case 'currency':
      return AlignmentType.RIGHT;

    case 'date':
    case 'datetime':
    case 'boolean':
      return AlignmentType.CENTER;

    default:
      return AlignmentType.LEFT;
  }
}
```

**Step 1.4: Update Total Cell for Colspan Support**
```typescript
static totalCell(text: string | number, align: any = AlignmentType.RIGHT, colspan: number = 1): TableCell {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text: text?.toString() || '0', bold: true })],
      alignment: align,
    })],
    shading: {
      fill: 'F0F0F0',
      type: ShadingType.SOLID,
    },
    columnSpan: colspan > 1 ? colspan : undefined
  });
}
```

---

### Phase 2: Add Dynamic DOCX Download Method

**Goal:** Create downloadDynamicReportDOCX() method in reports component

**Step 2.1: Add New Method to ReportsComponent**

File: `src/app/pages/reports/reports.component.ts`

```typescript
/**
 * Download dynamic report as DOCX file
 */
async downloadDynamicReportDOCX() {
  if (!this.dynamicReportData) {
    console.error('No dynamic report data to download');
    return;
  }

  const children: any[] = [
    // ===== DOCUMENT HEADER =====
    new Paragraph({
      text: 'Administrative Report',
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
    new Paragraph({
      text: this.dynamicReportData.unitName,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: this.dynamicReportData.unitLocationName,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `${this.dynamicReportData.monthName} ${this.dynamicReportData.year}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      text: `Generated: ${new Date(this.dynamicReportData.generatedAt).toLocaleString()}`,
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    new Paragraph({
      children: [new TextRun({
        text: `Total Approved Entries: ${this.dynamicReportData.totalEntries}`,
        bold: true
      })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    }),
  ];

  // ===== ADD DYNAMIC SECTIONS =====
  this.dynamicReportData.sections.forEach(section => {
    // Section heading
    children.push(
      DOCXTableBuilder.sectionHeading(
        `${section.displayName} (${section.totalRecords})`
      )
    );

    // Section table
    if (section.rows.length > 0) {
      children.push(
        DOCXTableBuilder.createDynamicTable(section, this.formatCellValue.bind(this))
      );
    } else {
      // Empty section message
      children.push(
        new Paragraph({
          text: 'No data available for this section',
          alignment: AlignmentType.CENTER,
          italics: true,
          spacing: { after: 200 },
        })
      );
    }

    // Spacing between sections
    children.push(DOCXTableBuilder.emptyLine());
  });

  // ===== CREATE DOCX DOCUMENT =====
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: 720,    // 0.5 inch
            right: 720,
            bottom: 720,
            left: 720,
          },
        },
      },
      children,
    }],
  });

  // ===== DOWNLOAD FILE =====
  const blob = await Packer.toBlob(doc);
  const filename = `Dynamic_Report_${this.dynamicReportData.unitName}_${this.dynamicReportData.monthName}_${this.dynamicReportData.year}.docx`;
  saveAs(blob, filename);
}
```

---

### Phase 3: Update UI to Support Both Download Methods

**Step 3.1: Modify Download Button Logic**

File: `src/app/pages/reports/reports.component.html`

**Current Code (lines ~150-155):**
```html
<button class="btn-download" (click)="downloadDOCX()">
  📥 Download Report (DOCX)
</button>
```

**Updated Code:**
```html
<button class="btn-download"
        (click)="useDynamicReport ? downloadDynamicReportDOCX() : downloadDOCX()"
        [disabled]="!(dynamicReportData || reportData)">
  📥 Download Report (DOCX)
</button>
```

**Step 3.2: Add Download Button to Legacy Report Section**

Ensure legacy report section also has download button:
```html
<div class="report-content" *ngIf="reportData && !useDynamicReport">
  <div class="report-header">
    <!-- ... header content ... -->
    <button class="btn-download" (click)="downloadDOCX()">
      📥 Download Report (DOCX)
    </button>
  </div>
  <!-- ... rest of template ... -->
</div>
```

---

### Phase 4: Testing & Validation

**Test Cases:**

**TC1: Download Dynamic Report - Single Section**
- Configure report with 1 section, 3 columns
- Generate dynamic report
- Click download button
- Verify DOCX file:
  - Contains correct header information
  - Has 1 section with 3 columns
  - Data is correctly formatted
  - File downloads successfully

**TC2: Download Dynamic Report - Multiple Sections**
- Configure report with 4 sections, varying columns
- Generate dynamic report
- Click download button
- Verify DOCX file:
  - All 4 sections present
  - Each section has correct columns
  - Sections are properly separated
  - Total rows display correctly (if applicable)

**TC3: Download Dynamic Report - All Data Types**
- Configure sections with columns of different data types:
  - String
  - Number/Integer
  - Decimal/Float
  - Currency
  - Date/DateTime
  - Boolean
- Generate and download report
- Verify formatting:
  - Currency: ₹1,234.56 format
  - Date: Localized date format
  - Boolean: "Yes" / "No"
  - Numbers: Right-aligned
  - Text: Left-aligned

**TC4: Download Legacy Report**
- Generate legacy report (any unit type)
- Click download button
- Verify legacy download still works
- Verify filename format

**TC5: Empty Sections**
- Configure report with sections that have no data
- Generate and download report
- Verify empty sections show appropriate message

**TC6: Preview Mode**
- Configure report
- Click Preview
- Verify download button works in preview mode
- Verify filename doesn't indicate preview

**TC7: Different Unit Types**
- Test dynamic download for:
  - FIU unit
  - ASM unit
  - Regular unit
- Verify correct unit name in filename

---

### Phase 5: Enhancements & Optimizations

**Enhancement 1: Column Width Support**
```typescript
// Use width metadata from column definition
static createDynamicTable(section: ReportSection, formatCellFn: Function): Table {
  const columnWidths = section.columns.map(col => ({
    size: col.width || (100 / section.columns.length),
    type: WidthType.PERCENTAGE
  }));

  // Apply widths to cells...
}
```

**Enhancement 2: Alternating Row Colors**
```typescript
const dataRows = section.rows.map((row, index) => {
  const isEvenRow = index % 2 === 0;
  const cells = /* ... cell creation ... */;

  return new TableRow({
    children: cells,
    shading: isEvenRow ? undefined : {
      fill: 'F9F9F9',  // Light gray for odd rows
      type: ShadingType.SOLID
    }
  });
});
```

**Enhancement 3: Section Summary Statistics**
```typescript
// Add summary paragraph before each section
if (section.showTotal && section.totalValue !== null) {
  children.push(
    new Paragraph({
      text: `Section Total: ${section.totalValue}`,
      alignment: AlignmentType.RIGHT,
      spacing: { before: 100, after: 100 },
      italics: true
    })
  );
}
```

**Enhancement 4: Add Watermark for Preview Mode**
```typescript
if (this.isPreviewMode) {
  // Add watermark to document
  const doc = new Document({
    sections: [{
      properties: {
        page: { /* ... */ },
        watermark: {
          text: 'PREVIEW',
          opacity: 0.3,
          type: WatermarkType.TEXT,
        }
      },
      children
    }]
  });
}
```

---

## Recommendations & Best Practices

### Architectural Improvements

#### 1. Refactor DOCXTableBuilder to Builder Pattern

**Current Issue:** Static utility class lacks extensibility

**Recommendation:** Implement Builder Pattern

```typescript
export class DynamicDOCXTableBuilder {
  private section: ReportSection;
  private formatFn: (value: any, dataType: string) => string;
  private options: TableOptions = {
    headerColor: '2196F3',
    totalColor: 'F0F0F0',
    alternatingRows: false,
    showTotal: true
  };

  constructor(section: ReportSection, formatFn: Function) {
    this.section = section;
    this.formatFn = formatFn;
  }

  withHeaderColor(color: string): this {
    this.options.headerColor = color;
    return this;
  }

  withAlternatingRows(enabled: boolean): this {
    this.options.alternatingRows = enabled;
    return this;
  }

  build(): Table {
    // Generate table with configured options
  }
}

// Usage:
const table = new DynamicDOCXTableBuilder(section, formatCellValue)
  .withHeaderColor('4CAF50')
  .withAlternatingRows(true)
  .build();
```

**Benefits:**
- Configurable options
- Reusable across different report types
- Easier testing
- Better maintainability

---

#### 2. Create Report Generation Service

**Current Issue:** Report logic embedded in component

**Recommendation:** Extract to dedicated service

```typescript
// File: src/app/core/services/report-generation.service.ts

@Injectable({
  providedIn: 'root'
})
export class ReportGenerationService {

  async generateDynamicDOCX(
    reportData: DynamicReportData,
    options?: DocxGenerationOptions
  ): Promise<Blob> {
    const doc = this.buildDocument(reportData, options);
    return await Packer.toBlob(doc);
  }

  async generateLegacyDOCX(
    reportData: ReportData,
    unitType: 'FIU' | 'ASM' | 'REGULAR'
  ): Promise<Blob> {
    const doc = this.buildLegacyDocument(reportData, unitType);
    return await Packer.toBlob(doc);
  }

  private buildDocument(data: DynamicReportData, options?: DocxGenerationOptions): Document {
    // Document building logic
  }

  private buildLegacyDocument(data: ReportData, unitType: string): Document {
    // Legacy document building logic
  }
}

// Usage in component:
async downloadReport() {
  const blob = await this.reportGenService.generateDynamicDOCX(this.dynamicReportData);
  saveAs(blob, this.getFilename());
}
```

**Benefits:**
- Separation of concerns
- Easier unit testing
- Reusable across components
- Can add caching/optimization

---

#### 3. Implement Strategy Pattern for Unit Types

**Current Issue:** Conditional logic based on unit type

**Recommendation:** Use Strategy Pattern

```typescript
// File: src/app/core/strategies/report-strategy.interface.ts

export interface ReportGenerationStrategy {
  buildSections(reportData: any): Paragraph[];
  getFilename(reportData: any): string;
}

export class FIUReportStrategy implements ReportGenerationStrategy {
  buildSections(reportData: ReportData): Paragraph[] {
    // FIU-specific section building
  }

  getFilename(reportData: ReportData): string {
    return `FIU_Report_${reportData.unitName}_${reportData.monthName}_${reportData.year}.docx`;
  }
}

export class ASMReportStrategy implements ReportGenerationStrategy {
  buildSections(reportData: ReportData): Paragraph[] {
    // ASM-specific section building
  }

  getFilename(reportData: ReportData): string {
    return `ASM_Report_${reportData.unitName}_${reportData.monthName}_${reportData.year}.docx`;
  }
}

export class RegularReportStrategy implements ReportGenerationStrategy {
  buildSections(reportData: ReportData): Paragraph[] {
    // Regular unit section building
  }

  getFilename(reportData: ReportData): string {
    return `Report_${reportData.unitName}_${reportData.monthName}_${reportData.year}.docx`;
  }
}

// Factory
export class ReportStrategyFactory {
  static getStrategy(unitType: string): ReportGenerationStrategy {
    switch (unitType) {
      case 'FIU': return new FIUReportStrategy();
      case 'ASM': return new ASMReportStrategy();
      default: return new RegularReportStrategy();
    }
  }
}

// Usage:
const strategy = ReportStrategyFactory.getStrategy(this.getUnitType());
const sections = strategy.buildSections(this.reportData);
const filename = strategy.getFilename(this.reportData);
```

**Benefits:**
- Eliminates if/else chains
- Easy to add new unit types
- Better testability
- Clear responsibility boundaries

---

### Code Quality Improvements

#### 1. Add Type Safety to DOCXTableBuilder

**Current Code:**
```typescript
static createProgramsTable(programs: any[]): Table
```

**Recommended:**
```typescript
interface Program {
  programType: string;
  title: string;
  dateFrom: string;
  dateTo: string;
  duration: number;
  participants: number;
  status: string;
}

static createProgramsTable(programs: Program[]): Table
```

**Benefits:**
- Compile-time type checking
- Better IDE autocomplete
- Prevents runtime errors
- Self-documenting code

---

#### 2. Add Error Handling

**Current Code:**
```typescript
async downloadDOCX() {
  // No try-catch
  const blob = await Packer.toBlob(doc);
  saveAs(blob, docxFilename);
}
```

**Recommended:**
```typescript
async downloadDOCX() {
  try {
    this.loading = true;
    const blob = await Packer.toBlob(doc);
    saveAs(blob, docxFilename);
  } catch (error) {
    console.error('Failed to generate DOCX:', error);
    this.error = 'Failed to download report. Please try again.';
    // Optional: Send error to monitoring service
  } finally {
    this.loading = false;
  }
}
```

---

#### 3. Add Loading States

**Current Code:**
No loading indicator during DOCX generation

**Recommended:**
```typescript
// Add property
isGeneratingDOCX = false;

// Update method
async downloadDynamicReportDOCX() {
  this.isGeneratingDOCX = true;
  try {
    // ... generation logic ...
  } finally {
    this.isGeneratingDOCX = false;
  }
}

// Update template
<button class="btn-download"
        (click)="downloadDynamicReportDOCX()"
        [disabled]="!dynamicReportData || isGeneratingDOCX">
  <span *ngIf="!isGeneratingDOCX">📥 Download Report (DOCX)</span>
  <span *ngIf="isGeneratingDOCX">⏳ Generating...</span>
</button>
```

---

### Performance Optimizations

#### 1. Lazy Load DOCX Library

**Current Code:**
```typescript
import { Document, Packer, ... } from 'docx';
```

**Recommended:**
```typescript
async downloadDynamicReportDOCX() {
  const { Document, Packer, Paragraph, ... } = await import('docx');
  // Use imported classes
}
```

**Benefits:**
- Reduces initial bundle size
- Faster page load
- Only loads when download is triggered

---

#### 2. Memoize Formatted Values

**Current Code:**
```typescript
// formatCellValue called repeatedly for same values
formatCellValue(value, dataType)
```

**Recommended:**
```typescript
private formattedValueCache = new Map<string, string>();

formatCellValue(value: any, dataType: string): string {
  const cacheKey = `${value}_${dataType}`;

  if (this.formattedValueCache.has(cacheKey)) {
    return this.formattedValueCache.get(cacheKey)!;
  }

  const formatted = this._formatCellValue(value, dataType);
  this.formattedValueCache.set(cacheKey, formatted);
  return formatted;
}
```

---

### Testing Recommendations

#### 1. Unit Tests for DOCXTableBuilder

```typescript
describe('DOCXTableBuilder', () => {
  describe('createDynamicTable', () => {
    it('should create table with correct number of columns', () => {
      const section: ReportSection = {
        sectionKey: 'test',
        displayName: 'Test Section',
        totalRecords: 2,
        columns: [
          { key: 'col1', displayName: 'Column 1', dataType: 'string' },
          { key: 'col2', displayName: 'Column 2', dataType: 'number' }
        ],
        rows: [
          { col1: 'Value 1', col2: 123 },
          { col1: 'Value 2', col2: 456 }
        ]
      };

      const table = DOCXTableBuilder.createDynamicTable(
        section,
        (v, dt) => v?.toString() || '-'
      );

      expect(table.rows.length).toBe(3); // Header + 2 data rows
      expect(table.rows[0].cells.length).toBe(3); // Sl.No + 2 columns
    });

    it('should format currency values correctly', () => {
      // Test currency formatting
    });

    it('should add total row when showTotal is true', () => {
      // Test total row logic
    });
  });
});
```

#### 2. Integration Tests for Report Generation

```typescript
describe('ReportGenerationService', () => {
  it('should generate valid DOCX blob', async () => {
    const blob = await service.generateDynamicDOCX(mockReportData);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should include all selected sections', async () => {
    // Test section inclusion
  });
});
```

---

### Documentation Best Practices

#### 1. Add JSDoc Comments

```typescript
/**
 * Creates a dynamic DOCX table from report section data
 *
 * @param section - Report section containing columns and rows
 * @param formatCellFn - Function to format cell values based on data type
 * @returns Table object ready for DOCX document inclusion
 *
 * @example
 * ```typescript
 * const table = DOCXTableBuilder.createDynamicTable(
 *   reportSection,
 *   (value, dataType) => formatCellValue(value, dataType)
 * );
 * ```
 */
static createDynamicTable(
  section: ReportSection,
  formatCellFn: (value: any, dataType: string) => string
): Table {
  // Implementation
}
```

#### 2. Add README for DOCXTableBuilder

Create: `src/app/shared/docx-table-builder.README.md`

```markdown
# DOCXTableBuilder Utility

## Overview
Utility class for generating formatted DOCX tables

## Usage

### Legacy Tables
```typescript
DOCXTableBuilder.createProgramsTable(programs)
```

### Dynamic Tables
```typescript
DOCXTableBuilder.createDynamicTable(section, formatFn)
```

## Available Methods
- `createDynamicTable()` - ✨ NEW: Flexible table generation
- `createFIUTable()` - FIU-specific tables
- ...

## Examples
See examples/ directory for usage patterns
```

---

### Security Considerations

#### 1. Sanitize User Input

```typescript
// Sanitize section display names to prevent injection
const sanitizeText = (text: string): string => {
  return text.replace(/[<>]/g, '');
};

children.push(
  DOCXTableBuilder.sectionHeading(
    sanitizeText(section.displayName)
  )
);
```

#### 2. Validate Data Before Generation

```typescript
private validateDynamicReportData(data: DynamicReportData): boolean {
  if (!data || !data.sections || data.sections.length === 0) {
    return false;
  }

  return data.sections.every(section =>
    section.columns &&
    section.columns.length > 0 &&
    section.rows !== undefined
  );
}

async downloadDynamicReportDOCX() {
  if (!this.validateDynamicReportData(this.dynamicReportData)) {
    this.error = 'Invalid report data';
    return;
  }
  // ... proceed with generation
}
```

---

### Monitoring & Analytics

#### 1. Track Download Events

```typescript
async downloadDynamicReportDOCX() {
  // Log download event
  console.log('Dynamic DOCX download initiated', {
    unitId: this.selectedUnit,
    locationId: this.selectedLocation,
    month: this.selectedMonth,
    year: this.selectedYear,
    sectionCount: this.dynamicReportData.sections.length,
    totalRecords: this.dynamicReportData.totalEntries
  });

  // Generate and download
  // ...

  // Log success
  console.log('Dynamic DOCX download completed successfully');
}
```

#### 2. Track Generation Time

```typescript
async downloadDynamicReportDOCX() {
  const startTime = performance.now();

  try {
    // ... generation logic ...

    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`DOCX generation took ${duration.toFixed(2)}ms`);

    // Send to analytics if duration > threshold
    if (duration > 5000) {
      console.warn('Slow DOCX generation detected');
    }
  } catch (error) {
    // ...
  }
}
```

---

## Summary & Next Steps

### Current State

✅ **Working:**
- Dynamic report configuration UI
- Dynamic report HTML preview
- Legacy DOCX download
- Modal-based section/column selection

❌ **Missing:**
- Dynamic DOCX download functionality
- Flexible table generation
- Integration between dynamic data and DOCX output

### Implementation Priority

1. **HIGH PRIORITY - Phase 1 & 2**
   - Create `createDynamicTable()` method
   - Implement `downloadDynamicReportDOCX()` method
   - Update UI to call correct download method
   - **Estimated Effort:** 8-12 hours

2. **MEDIUM PRIORITY - Phase 3 & 4**
   - Add comprehensive testing
   - Add error handling and loading states
   - Validate with different unit types
   - **Estimated Effort:** 6-8 hours

3. **LOW PRIORITY - Phase 5**
   - Add enhancements (alternating rows, column widths)
   - Implement architectural improvements
   - Refactor to service layer
   - **Estimated Effort:** 12-16 hours

### Success Metrics

- [ ] Users can download dynamic reports as DOCX
- [ ] DOCX file contains all user-selected sections
- [ ] DOCX file contains only user-selected columns
- [ ] Data formatting matches HTML preview
- [ ] Download works for all unit types
- [ ] No breaking changes to legacy downloads

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Breaking legacy downloads | Keep legacy methods separate; add feature flag |
| Performance issues | Implement lazy loading and caching |
| Data format incompatibility | Add validation before generation |
| Large file sizes | Implement pagination or section limits |

---

**End of Documentation**

For questions or clarifications, please contact the development team.

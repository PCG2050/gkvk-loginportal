// Dynamic Report Request Models

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

// Dynamic Report Response Models

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

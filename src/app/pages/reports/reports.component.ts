import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Endpoints } from '../../shared/endpoints.model';
import { HttpHeaders } from '@angular/common/http';
import { Document, Packer, Paragraph, AlignmentType, HeadingLevel, TextRun } from 'docx';
import { saveAs } from 'file-saver';
import { DOCXTableBuilder } from '../../shared/docx-table-builder';
import { UserService } from '../../core/services/user.service';
import {
  DynamicReportRequest,
  DynamicReportData,
  ReportConfiguration,
  SectionRequest,
  ReportSection
} from './dynamic-report.models';
import { ReportConfigModalComponent } from './report-config-modal/report-config-modal.component';

interface FilterOptions {
  units: Array<{
    unitId: number;
    unitName: string;
    locations: Array<{
      unitLocationId: number;
      districtName: string;
      stateName: string;
      districtId: number;
      stateId: number;
    }>;
  }>;
  years: number[];
}

interface FIUActivity {
  slNo: number;
  activityName: string;
  count: number;
}

interface ASMVisitor {
  slNo: number;
  particulars: string;
  noOfVisitors: number;
}

interface ReportData {
  unitName: string;
  unitLocationName: string;
  monthName: string;
  month: number;
  year: number;
  generatedAt: string;
  totalEntries: number;
  programs: any[];
  publications: any[];
  nominations: any[];
  consultancies: any[];
  services: any[];
  otherActivities: any[];
  // FIU Activities
  fiuActivities?: {
    activities: FIUActivity[];
    totalActivities: number;
    totalCount: number;
    totalEntries: number;
  };
  // ASM Activities
  asmActivities?: {
    visitors: ASMVisitor[];
    totalVisitors: number;
    totalEntries: number;
  };
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule, ReportConfigModalComponent],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  
  // Filter options
  filterOptions: FilterOptions | null = null;
  selectedUnit: number | null = null;
  selectedLocation: number | null = null;
  selectedMonth: number = new Date().getMonth() + 1;
  selectedYear: number = new Date().getFullYear();
  
  // Report data (Legacy)
  reportData: ReportData | null = null;
  loading = false;
  error: string | null = null;

  public isFIUUnit: boolean = false;
  public isASMUnit: boolean = false;
  public isUnitHead: boolean = false;

  // Dynamic Report Properties
  useDynamicReport: boolean = true; // Toggle between old and new system
  reportConfiguration: ReportConfiguration | null = null;
  dynamicReportData: DynamicReportData | null = null;
  selectedSections: Map<string, SectionRequest> = new Map();

  // Modal state
  isConfigModalOpen = false;
  isPreviewMode = false;
  
  unitHeadStats: any = {
    assignedUnitsCount: 0,
    trainersCount: 0,
    pendingApprovalsCount: 0,
    approvedThisMonthCount: 0
  };

  readonly FIU_UNIT_ID = 3;
  readonly ASM_UNIT_ID = 7;

  months = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Get user role from localStorage
    const userRole = localStorage.getItem('role');
    this.isUnitHead = userRole === 'UNITHEAD';
    
    this.loadFilterOptions();
    
    if (this.isUnitHead) {
      this.loadUnitHeadStatistics();
    }
  }

  loadUnitHeadStatistics() {
    const unitHeadId = localStorage.getItem('userId');
    if (!unitHeadId) return;

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('authtoken')}`
    });

    this.http.get<any>(`${Endpoints.unitHead}/${unitHeadId}/statistics`, { headers })
      .subscribe({
        next: (data) => {
          this.unitHeadStats = data;
        },
        error: (err) => {
          console.error('Failed to load unit head statistics', err);
        }
      });
  }

  loadFilterOptions() {
    const token = localStorage.getItem('authtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<FilterOptions>(Endpoints.filterOptions, { headers })
      .subscribe({
        next: (data) => {
          // Ensure units exist and sort ascending by unitId
          if (data && Array.isArray(data.units)) {
            data.units = data.units.slice().sort((a, b) => a.unitId - b.unitId);
          }
          this.filterOptions = data ?? null;
          console.log('Filter options loaded successfully:', data);
        },
        error: (err) => {
          this.error = 'Failed to load filter options';
          console.error('Filter options error - Status:', err.status);
          console.error('Filter options error - Message:', err.error);
          console.error('Filter options error - Full error:', err);
        }
      });
  }

  get availableLocations() {
    if (!this.filterOptions || !this.selectedUnit) return [];
    const unit = this.filterOptions.units.find(u => u.unitId === this.selectedUnit);
    return unit?.locations || [];
  }

  onUnitChange() {
    this.selectedLocation = null;
    this.reportData = null;
    this.dynamicReportData = null;
    this.error = null; // Clear any previous errors
    // Check if selected unit is FIU or ASM
    this.isFIUUnit = this.selectedUnit === this.FIU_UNIT_ID;
    this.isASMUnit = this.selectedUnit === this.ASM_UNIT_ID;

    // Load dynamic report configuration for the selected unit
    if (this.useDynamicReport && this.selectedUnit) {
      this.loadReportConfiguration(this.selectedUnit);
    }
  }

  onLocationChange() {
    this.reportData = null;
    this.dynamicReportData = null;
    this.error = null; // Clear any previous errors
  }

  onMonthChange() {
    this.reportData = null;
    this.dynamicReportData = null;
    this.error = null; // Clear any previous errors
  }

  onYearChange() {
    this.reportData = null;
    this.dynamicReportData = null;
    this.error = null; // Clear any previous errors
  }

  generateReport() {
    if (this.useDynamicReport) {
      this.generateDynamicReport();
    } else {
      this.generateLegacyReport();
    }
  }

  generateLegacyReport() {
    const token = localStorage.getItem('authtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    if (!this.selectedLocation) {
      this.error = 'Please select a location';
      return;
    }

    this.loading = true;
    this.error = null;

    const filter = {
      unitLocationId: this.selectedLocation,
      month: this.selectedMonth,
      year: this.selectedYear
    };

    this.http.post<ReportData>(Endpoints.generateReport, filter, { headers })
      .subscribe({
        next: (data) => {
          this.reportData = data;
          // Check if response has FIU or ASM activities
          this.isFIUUnit = !!(data.fiuActivities && data.fiuActivities.activities.length > 0);
          this.isASMUnit = !!(data.asmActivities && data.asmActivities.visitors && data.asmActivities.visitors.length > 0);
          this.loading = false;
        },
        error: (err) => {
          // Handle specific error cases
          if (err.status === 403) {
            this.error = 'Access Denied: You do not have permission to view this unit location. Please select from your assigned units only.';
          } else if (err.status === 401) {
            this.error = 'Unauthorized: Please log in again.';
          } else if (err.status === 404) {
            this.error = 'No data found for the selected filters.';
          } else {
            this.error = 'Failed to generate report. Please try again.';
          }
          this.loading = false;
          console.error('Report generation error:', err);
        }
      });
  }

  // ========================================
  // DYNAMIC REPORT METHODS
  // ========================================

  /**
   * Load report configuration for the selected unit
   */
  loadReportConfiguration(unitId: number) {
    const token = localStorage.getItem('authtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.get<ReportConfiguration>(`${Endpoints.dynamicReportConfiguration}?unitId=${unitId}`, { headers })
      .subscribe({
        next: (config) => {
          this.reportConfiguration = config;
          // Auto-select default sections
          this.selectedSections.clear();
          config.availableSections.forEach((section: any) => {
            if (config.defaultSections.includes(section.sectionKey)) {
              this.selectedSections.set(section.sectionKey, {
                sectionKey: section.sectionKey,
                selectedColumns: section.defaultColumns,
                sortDirection: 'asc'
              });
            }
          });
          console.log('Report configuration loaded:', config);
        },
        error: (err) => {
          console.error('Failed to load report configuration:', err);
          this.error = 'Failed to load report configuration';
        }
      });
  }

  /**
   * Generate dynamic report with selected sections
   */
  generateDynamicReport() {
    const token = localStorage.getItem('authtoken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    if (!this.selectedLocation) {
      this.error = 'Please select a location';
      return;
    }

    if (this.selectedSections.size === 0) {
      this.error = 'Please select at least one section';
      return;
    }

    this.loading = true;
    this.error = null;

    const request: DynamicReportRequest = {
      unitLocationId: this.selectedLocation,
      month: this.selectedMonth,
      year: this.selectedYear,
      sections: Array.from(this.selectedSections.values())
    };

    this.http.post<DynamicReportData>(Endpoints.dynamicReportGenerate, request, { headers })
      .subscribe({
        next: (data) => {
          this.dynamicReportData = data;
          this.reportData = null; // Clear legacy data
          this.loading = false;
          console.log('Dynamic report generated:', data);
        },
        error: (err) => {
          // Handle specific error cases
          if (err.status === 403) {
            this.error = 'Access Denied: You do not have permission to view this unit location.';
          } else if (err.status === 401) {
            this.error = 'Unauthorized: Please log in again.';
          } else if (err.status === 404) {
            this.error = 'No data found for the selected filters.';
          } else {
            this.error = err.error?.message || 'Failed to generate report. Please try again.';
          }
          this.loading = false;
          console.error('Dynamic report generation error:', err);
        }
      });
  }

  /**
   * Toggle section selection
   */
  toggleSection(sectionKey: string) {
    if (this.selectedSections.has(sectionKey)) {
      this.selectedSections.delete(sectionKey);
    } else {
      const section = this.reportConfiguration?.availableSections.find((s: any) => s.sectionKey === sectionKey);
      if (section) {
        this.selectedSections.set(sectionKey, {
          sectionKey: section.sectionKey,
          selectedColumns: section.defaultColumns,
          sortDirection: 'asc'
        });
      }
    }
  }

  /**
   * Check if section is selected
   */
  isSectionSelected(sectionKey: string): boolean {
    return this.selectedSections.has(sectionKey);
  }

  /**
   * Format cell value based on data type
   */
  formatCellValue(value: any, dataType: string): string {
    if (value === null || value === undefined) {
      return '-';
    }

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
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(value);
      case 'boolean':
        return value ? 'Yes' : 'No';
      default:
        return value.toString();
    }
  }

  // ========================================
  // MODAL METHODS
  // ========================================

  /**
   * Open report configuration modal
   */
  openConfigModal() {
    if (!this.selectedUnit) {
      this.error = 'Please select a unit first';
      return;
    }

    if (!this.selectedLocation) {
      this.error = 'Please select a location first';
      return;
    }

    this.isConfigModalOpen = true;
  }

  /**
   * Close report configuration modal
   */
  closeConfigModal() {
    this.isConfigModalOpen = false;
  }

  /**
   * Handle preview from modal
   */
  onPreviewReport(sections: Map<string, SectionRequest>) {
    this.selectedSections = sections;
    this.isPreviewMode = true;
    this.generateDynamicReport();
    // Don't close modal - let user see preview and make changes
  }

  /**
   * Handle generate from modal
   */
  onGenerateReport(sections: Map<string, SectionRequest>) {
    this.selectedSections = sections;
    this.isPreviewMode = false;
    this.generateDynamicReport();
    this.closeConfigModal();
  }

  /**
   * Download report as editable DOCX file
   */
  async downloadDOCX() {
    if (!this.reportData) return;

    const children: any[] = [
      // ===== DOCUMENT HEADER =====
      new Paragraph({
        text: 'Administrative Report',
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      }),
      new Paragraph({
        text: this.reportData.unitName,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: this.reportData.unitLocationName,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: `${this.reportData.monthName} ${this.reportData.year}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        text: `Generated: ${new Date(this.reportData.generatedAt).toLocaleString()}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({
          text: `Total Approved Entries: ${this.reportData.totalEntries}`,
          bold: true
        })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      }),
    ];

    // ===== FIU UNIT REPORT =====
    if (this.isFIUUnit && this.reportData.fiuActivities) {
      // FIU Activities Table
      children.push(
        DOCXTableBuilder.sectionHeading(
          `FIU MEDIA ACTIVITIES (Total: ${this.reportData.fiuActivities.totalCount})`
        ),
        DOCXTableBuilder.createFIUTable(this.reportData.fiuActivities.activities),
        DOCXTableBuilder.emptyLine(),
      );

      // Other Activities for FIU
      if (this.reportData.otherActivities && this.reportData.otherActivities.length > 0) {
        children.push(
          DOCXTableBuilder.sectionHeading(
            `OTHER ACTIVITIES (${this.reportData.otherActivities.length})`
          ),
          DOCXTableBuilder.createOtherActivitiesTable(this.reportData.otherActivities),
          DOCXTableBuilder.emptyLine(),
        );
      }
    }

    // ===== ASM UNIT REPORT =====
    else if (this.isASMUnit && this.reportData.asmActivities) {
      // ASM Visitor Statistics Table
      children.push(
        DOCXTableBuilder.sectionHeading(
          `ASM VISITOR STATISTICS (Total: ${this.reportData.asmActivities.totalVisitors})`
        ),
        DOCXTableBuilder.createASMTable(this.reportData.asmActivities.visitors),
        DOCXTableBuilder.emptyLine(),
      );

      // Other Activities for ASM
      if (this.reportData.otherActivities && this.reportData.otherActivities.length > 0) {
        children.push(
          DOCXTableBuilder.sectionHeading(
            `OTHER ACTIVITIES (${this.reportData.otherActivities.length})`
          ),
          DOCXTableBuilder.createOtherActivitiesTable(this.reportData.otherActivities),
          DOCXTableBuilder.emptyLine(),
        );
      }
    }

    // ===== OTHER UNITS REPORT =====
    else {
      // 1. PROGRAMS
      if (this.reportData.programs && this.reportData.programs.length > 0) {
        children.push(
          DOCXTableBuilder.sectionHeading(`PROGRAMS (${this.reportData.programs.length})`),
          DOCXTableBuilder.createProgramsTable(this.reportData.programs),
          DOCXTableBuilder.emptyLine(),
        );
      }

      // 2. PUBLICATIONS
      if (this.reportData.publications && this.reportData.publications.length > 0) {
        children.push(
          DOCXTableBuilder.sectionHeading(`PUBLICATIONS (${this.reportData.publications.length})`),
          DOCXTableBuilder.createPublicationsTable(this.reportData.publications),
          DOCXTableBuilder.emptyLine(),
        );
      }

      // 3. NOMINATION & REWARDS
      if (this.reportData.nominations && this.reportData.nominations.length > 0) {
        children.push(
          DOCXTableBuilder.sectionHeading(`NOMINATION & REWARDS (${this.reportData.nominations.length})`),
          DOCXTableBuilder.createNominationsTable(this.reportData.nominations),
          DOCXTableBuilder.emptyLine(),
        );
      }

      // 4. CONSULTANCY SERVICES
      if (this.reportData.consultancies && this.reportData.consultancies.length > 0) {
        children.push(
          DOCXTableBuilder.sectionHeading(`CONSULTANCY SERVICES (${this.reportData.consultancies.length})`),
          DOCXTableBuilder.createConsultanciesTable(this.reportData.consultancies),
          DOCXTableBuilder.emptyLine(),
        );
      }

      // 5. SERVICES / FACILITIES
      if (this.reportData.services && this.reportData.services.length > 0) {
        children.push(
          DOCXTableBuilder.sectionHeading(`SERVICES / FACILITIES (${this.reportData.services.length})`),
          DOCXTableBuilder.createServicesTable(this.reportData.services),
          DOCXTableBuilder.emptyLine(),
        );
      }

      // 6. OTHER ACTIVITIES
      if (this.reportData.otherActivities && this.reportData.otherActivities.length > 0) {
        children.push(
          DOCXTableBuilder.sectionHeading(`OTHER ACTIVITIES (${this.reportData.otherActivities.length})`),
          DOCXTableBuilder.createOtherActivitiesTable(this.reportData.otherActivities),
          DOCXTableBuilder.emptyLine(),
        );
      }
    }

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
    let docxFilename: string;

    if (this.isFIUUnit) {
      docxFilename = `FIU_Report_${this.reportData.unitName}_${this.reportData.monthName}_${this.reportData.year}.docx`;
    } else if (this.isASMUnit) {
      docxFilename = `ASM_Report_${this.reportData.unitName}_${this.reportData.monthName}_${this.reportData.year}.docx`;
    } else {
      docxFilename = `Report_${this.reportData.unitName}_${this.reportData.monthName}_${this.reportData.year}.docx`;
    }

    saveAs(blob, docxFilename);
  }
}
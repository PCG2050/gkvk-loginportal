import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ReportConfiguration,
  SectionDefinition,
  ColumnDefinition,
  SectionRequest
} from '../dynamic-report.models';

@Component({
  selector: 'app-report-config-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-config-modal.component.html',
  styleUrls: ['./report-config-modal.component.css']
})
export class ReportConfigModalComponent {
  @Input() isOpen = false;
  @Input() reportConfiguration: ReportConfiguration | null = null;
  @Input() selectedSections: Map<string, SectionRequest> = new Map();

  @Output() close = new EventEmitter<void>();
  @Output() preview = new EventEmitter<Map<string, SectionRequest>>();
  @Output() generate = new EventEmitter<Map<string, SectionRequest>>();

  activeTab: string | null = null; // Current section being configured
  searchTerm = '';

  /**
   * Toggle section selection
   */
  toggleSection(section: SectionDefinition) {
    if (this.selectedSections.has(section.sectionKey)) {
      this.selectedSections.delete(section.sectionKey);
      // If this was the active tab, reset it
      if (this.activeTab === section.sectionKey) {
        this.activeTab = null;
      }
    } else {
      // Add section with default columns
      this.selectedSections.set(section.sectionKey, {
        sectionKey: section.sectionKey,
        selectedColumns: [...section.defaultColumns],
        sortDirection: 'asc'
      });
      // Set as active tab for column selection
      this.activeTab = section.sectionKey;
    }
  }

  /**
   * Check if section is selected
   */
  isSectionSelected(sectionKey: string): boolean {
    return this.selectedSections.has(sectionKey);
  }

  /**
   * Get selected section configuration
   */
  getSelectedSection(sectionKey: string): SectionRequest | undefined {
    return this.selectedSections.get(sectionKey);
  }

  /**
   * Get section definition
   */
  getSectionDefinition(sectionKey: string): SectionDefinition | undefined {
    return this.reportConfiguration?.availableSections.find(
      (s: SectionDefinition) => s.sectionKey === sectionKey
    );
  }

  /**
   * Toggle column for a section
   */
  toggleColumn(sectionKey: string, columnKey: string) {
    const sectionRequest = this.selectedSections.get(sectionKey);
    if (!sectionRequest) return;

    const columnIndex = sectionRequest.selectedColumns.indexOf(columnKey);
    if (columnIndex > -1) {
      // Remove column (but keep at least one column)
      if (sectionRequest.selectedColumns.length > 1) {
        sectionRequest.selectedColumns.splice(columnIndex, 1);
      }
    } else {
      // Add column
      sectionRequest.selectedColumns.push(columnKey);
    }
  }

  /**
   * Check if column is selected for a section
   */
  isColumnSelected(sectionKey: string, columnKey: string): boolean {
    const sectionRequest = this.selectedSections.get(sectionKey);
    return sectionRequest?.selectedColumns.includes(columnKey) ?? false;
  }

  /**
   * Select all columns for a section
   */
  selectAllColumns(sectionKey: string) {
    const section = this.getSectionDefinition(sectionKey);
    const sectionRequest = this.selectedSections.get(sectionKey);
    if (!section || !sectionRequest) return;

    sectionRequest.selectedColumns = section.availableColumns.map((col: ColumnDefinition) => col.key);
  }

  /**
   * Deselect all columns except defaults for a section
   */
  resetToDefaults(sectionKey: string) {
    const section = this.getSectionDefinition(sectionKey);
    const sectionRequest = this.selectedSections.get(sectionKey);
    if (!section || !sectionRequest) return;

    sectionRequest.selectedColumns = [...section.defaultColumns];
  }

  /**
   * Set active tab for column configuration
   */
  setActiveTab(sectionKey: string) {
    this.activeTab = sectionKey;
  }

  /**
   * Get filtered columns based on search term
   */
  getFilteredColumns(columns: ColumnDefinition[]): ColumnDefinition[] {
    if (!this.searchTerm) return columns;

    const term = this.searchTerm.toLowerCase();
    return columns.filter(col =>
      col.displayName.toLowerCase().includes(term) ||
      col.key.toLowerCase().includes(term)
    );
  }

  /**
   * Get number of selected columns for a section
   */
  getSelectedColumnCount(sectionKey: string): number {
    return this.selectedSections.get(sectionKey)?.selectedColumns.length ?? 0;
  }

  /**
   * Get total available columns for a section
   */
  getTotalColumnCount(sectionKey: string): number {
    return this.getSectionDefinition(sectionKey)?.availableColumns.length ?? 0;
  }

  /**
   * Close modal
   */
  onClose() {
    this.close.emit();
  }

  /**
   * Preview report with current configuration
   */
  onPreview() {
    if (this.selectedSections.size === 0) {
      alert('Please select at least one section');
      return;
    }
    this.preview.emit(this.selectedSections);
  }

  /**
   * Generate final report
   */
  onGenerate() {
    if (this.selectedSections.size === 0) {
      alert('Please select at least one section');
      return;
    }
    this.generate.emit(this.selectedSections);
  }

  /**
   * Get selected sections as array
   */
  get selectedSectionsArray(): { key: string; definition: SectionDefinition; request: SectionRequest }[] {
    const result: { key: string; definition: SectionDefinition; request: SectionRequest }[] = [];

    this.selectedSections.forEach((request, key) => {
      const definition = this.getSectionDefinition(key);
      if (definition) {
        result.push({ key, definition, request });
      }
    });

    return result;
  }
}

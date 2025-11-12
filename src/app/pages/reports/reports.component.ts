import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Endpoints } from '../../shared/endpoints.model';
import { HttpHeaders } from '@angular/common/http';

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
}

@Component({
  selector: 'app-report',
  standalone: true,
  imports :[CommonModule, FormsModule],
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
  
  // Report data
  reportData: ReportData | null = null;
  loading = false;
  error: string | null = null;

  // Months for dropdown
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
    this.loadFilterOptions();
  }

  loadFilterOptions() {
  const token = localStorage.getItem('authtoken');
  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });  
    this.http.get<FilterOptions>(Endpoints.filterOptions,{headers})
      .subscribe({
        next: (data) => {
          this.filterOptions = data;
        },
        error: (err) => {
          this.error = 'Failed to load filter options';
          console.error(err);
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
  }

  generateReport() {
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

    this.http.post<ReportData>(Endpoints.generateReport, filter,{headers})
      .subscribe({
        next: (data) => {
          this.reportData = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to generate report';
          this.loading = false;
          console.error(err);
        }
      });
  }

  downloadPDF() {
    if (!this.reportData) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    // ===== HEADER =====
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Administrative Report', pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(this.reportData.unitName, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 6;
    doc.text(this.reportData.unitLocationName, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 6;
    doc.text(`${this.reportData.monthName} ${this.reportData.year}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 6;
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date(this.reportData.generatedAt).toLocaleString()}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 6;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Approved Entries: ${this.reportData.totalEntries}`, pageWidth / 2, currentY, { align: 'center' });
    
    currentY += 12;

    // ===== PROGRAMS TABLE =====
    if (this.reportData.programs && this.reportData.programs.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(76, 175, 80);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`PROGRAMS (${this.reportData.programs.length})`, 16, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Type', 'Title', 'Date From', 'Date To', 'Duration', 'Participants', 'Status']],
        body: this.reportData.programs.map(p => [
          p.programType || '-',
          p.title || '-',
          p.dateFrom || '-',
          p.dateTo || '-',
          p.duration?.toString() || '-',
          p.participants?.toString() || '-',
          p.status || '-'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      this.addNoDataSection(doc, 'PROGRAMS', currentY);
      currentY += 15;
    }

    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // ===== PUBLICATIONS TABLE =====
    if (this.reportData.publications && this.reportData.publications.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(76, 175, 80);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`PUBLICATIONS (${this.reportData.publications.length})`, 16, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Title', 'Pages']],
        body: this.reportData.publications.map(p => [
          p.category || '-',
          p.title || '-',
          p.pages || '-'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      this.addNoDataSection(doc, 'PUBLICATIONS', currentY);
      currentY += 15;
    }

    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // ===== NOMINATION & REWARDS TABLE =====
    if (this.reportData.nominations && this.reportData.nominations.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(76, 175, 80);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`NOMINATION & REWARDS (${this.reportData.nominations.length})`, 16, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Type', 'Award Name', 'Category', 'Date']],
        body: this.reportData.nominations.map(n => [
          n.type || '-',
          n.awardName || '-',
          n.category || '-',
          n.date || '-'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      this.addNoDataSection(doc, 'NOMINATION & REWARDS', currentY);
      currentY += 15;
    }

    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // ===== CONSULTANCY SERVICES TABLE =====
    if (this.reportData.consultancies && this.reportData.consultancies.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(76, 175, 80);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`CONSULTANCY SERVICES (${this.reportData.consultancies.length})`, 16, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Category', 'Title', 'Date']],
        body: this.reportData.consultancies.map(c => [
          c.category || '-',
          c.title || '-',
          c.date || '-'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    } else {
      this.addNoDataSection(doc, 'CONSULTANCY SERVICES', currentY);
      currentY += 15;
    }

    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    
   

// ===== SERVICES / FACILITIES TABLE =====
if (this.reportData.services && this.reportData.services.length > 0) {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(76, 175, 80);
  doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(`SERVICES / FACILITIES (${this.reportData.services.length})`, 16, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 8;

  autoTable(doc, {
    startY: currentY,
    head: [['Category', 'Particulars', 'Theme', 'Unit', 'Quantity', 'Amount']],
    body: this.reportData.services.map(s => [
      s.category || '-',
      s.title || '-',
      s.theme || '-',
      s.unit || '-',
      s.quantity?.toString() || '-',
      s.amount ? `₹${s.amount.toFixed(2)}` : '-'
    ]),
    theme: 'grid',
    headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold' },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      5: { halign: 'right' }  // Right-align amount column
    }
  });

  currentY = (doc as any).lastAutoTable.finalY + 10;
} else {
  this.addNoDataSection(doc, 'SERVICES / FACILITIES', currentY);
  currentY += 15;
}

    // ===== OTHER ACTIVITIES TABLE =====
    if (this.reportData.otherActivities && this.reportData.otherActivities.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(76, 175, 80);
      doc.rect(14, currentY - 5, pageWidth - 28, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(`OTHER ACTIVITIES (${this.reportData.otherActivities.length})`, 16, currentY);
      doc.setTextColor(0, 0, 0);
      currentY += 8;

      autoTable(doc, {
        startY: currentY,
        head: [['Title', 'Description']],
        body: this.reportData.otherActivities.map(a => [
          a.title || '-',
          a.description || '-'
        ]),
        theme: 'grid',
        headStyles: { fillColor: [76, 175, 80], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2 }
      });
    } else {
      this.addNoDataSection(doc, 'OTHER ACTIVITIES', currentY);
    }

    // ===== SAVE PDF =====
    const filename = `Report_${this.reportData.unitName}_${this.reportData.monthName}_${this.reportData.year}.pdf`;
    doc.save(filename);
  }

  private addNoDataSection(doc: jsPDF, title: string, y: number) {
    const pageWidth = doc.internal.pageSize.getWidth();
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(76, 175, 80);
    doc.rect(14, y - 5, pageWidth - 28, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(title, 16, y);
    doc.setTextColor(0, 0, 0);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text(`No ${title.toLowerCase()} found`, pageWidth / 2, y + 10, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  }
}
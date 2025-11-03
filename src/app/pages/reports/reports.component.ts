import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxPaginationModule } from 'ngx-pagination';
import { FilterPipeModule } from 'ngx-filter-pipe';
import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';
import { Units } from '../../core/models/units.model';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UnitsService } from '../../core/services/units.service';
import { HttpClient } from '@angular/common/http';
import { Endpoints } from '../../shared/endpoints.model';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ---------------- Interfaces ----------------
interface Report {
  slNo: number;
  week?: number;
  date: string;
  noOfParticipants?: number;
  noOfTrainees?: number;
  batch?: number;
  tpNo?: number;
  theme?: string;
  title?: string;
  duration?: string;
  activity?: number;
  no?: number;

  // ATIC
  particulars?: string;
  unit?: string;
  quantity?: number;
  amount?: number;
  category?: string;
}

interface ThemeReportByLocation {
  month?: string;
  title?: string;
  description?: string;
  location?: string;
  theme?: string;
  type?: string;
  category?: string;
  completedBatches?: number;
  ongoingBatches?: number;
  startedBatches?: number;
  totalParticipants: number;
  collaboration?: string;
  completedPrograms?: number;
  ongoingPrograms?: number;
  startedPrograms?: number;

  // ATIC
  quantity?: number;
  amount?: number;
  
  // IBT&VA
  items?: {
    product: string;
    quantity: number;
    amount: number;
  }[];
  totalAmount?: number;
}

// ✅ NEW: Extension Activities Interface
interface ExtensionActivities {
  methodSkillDemonstrations: {
    noOfProgrammes: number;
    noOfParticipants: { male: number; female: number; total: number };
    note: string;
  };
  advisoryServices: {
    faceToFaceContact: { male: number; female: number; total: number };
    telephoneCalls: { male: number; female: number; total: number };
  };
  exposureVisits: {
    organized: { noOfProgrammes: number; participants: { male: number; female: number; total: number } };
    participated: { noOfProgrammes: number; participants: { male: number; female: number; total: number } };
  };
  importantDays: {
    organized: { noOfProgrammes: number; participants: { male: number; female: number; total: number } };
    participated: { noOfProgrammes: number; participants: { male: number; female: number; total: number } };
  };
  importantEvents: {
    organized: { noOfProgrammes: number; participants: { male: number; female: number; total: number } };
    participated: { noOfProgrammes: number; participants: { male: number; female: number; total: number } };
  };
  melasExhibitions: {
    organized: { noOfProgrammes: number; participants: { male: number; female: number; total: number } };
    participated: { noOfProgrammes: number; participants: { male: number; female: number; total: number } };
  };
  visitorsToInstitute: { male: number; female: number; total: number };
  whatsappQueriesAnswered: { male: number; female: number; total: number };
  anyOther: {
    meetingParticipated: {
      noOfProgrammes: number;
      participants: { male: number; female: number; total: number };
    };
  };
}

// ---------------- Component ----------------
@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    NgxPaginationModule,
    FilterPipeModule,
    NgMultiSelectDropDownModule
  ]
})
export class ReportsComponent implements OnInit {
  units$!: Observable<Units[]>;
  selectedUnitId: number | null = null;
  selectedUnitName: string = '';

  reports: Report[] = [];
  themeReports: ThemeReportByLocation[] = [];
  
  // ✅ NEW: Extension Activities
  extensionActivities: ExtensionActivities | null = null;

  // Filtering Properties
  startDate: string = '';
  endDate: string = '';
  
  // Arrays to hold the currently displayed reports
  filteredReports: Report[] = [];
  filteredThemeReports: ThemeReportByLocation[] = [];

  selectedCategories: string[] = [];

  private unitsService = inject(UnitsService);
  private http = inject(HttpClient);

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits() {
    this.units$ = this.unitsService.getUnits().pipe(
      tap(list => console.log('Units:', list)),
      catchError(err => {
        console.error('Failed to fetch units', err);
        return of([]);
      })
    );
  }

  onUnitChange() {
    console.log('Selected Unit ID:', this.selectedUnitId, 'Type:', typeof this.selectedUnitId);

    if (!this.selectedUnitId) {
      this.reports = [];
      this.themeReports = [];
      this.extensionActivities = null;
      return;
    }

    const unitId = Number(this.selectedUnitId);
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Resolve unit name
    this.units$.subscribe(units => {
      if (units && Array.isArray(units) && this.selectedUnitId !== null) {
        const selected = units.find(u => u.id === unitId);
        this.selectedUnitName = selected?.name ?? '';
      } else {
        this.selectedUnitName = '';
      }
    });

    switch (this.selectedUnitId) {
      case 1: // FTI
        this.http.get<Report[]>(`${Endpoints.ftiReports}?unitId=1&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.reports = data, error: () => this.reports = [] });
        this.http.get<ThemeReportByLocation[]>(`${Endpoints.ftiThemeReports}?unitId=1&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.themeReports = data, error: () => this.themeReports = [] });
        break;

      case 2: // STU
        this.http.get<Report[]>(`${Endpoints.stuReports}?unitId=2`)
          .subscribe({ next: data => this.reports = data, error: () => this.reports = [] });
        this.http.get<ThemeReportByLocation[]>(`${Endpoints.stuThemeReportsByLocation}?unitId=2`)
          .subscribe({ next: data => this.themeReports = data, error: () => this.themeReports = [] });
        break;

      case 3: // FIU
        this.http.get<Report[]>(`${Endpoints.fiuReports}?unitId=3&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.reports = data, error: () => this.reports = [] });
        this.http.get<ThemeReportByLocation[]>(`${Endpoints.fiuOtherActivities}?unitId=3&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.themeReports = data, error: () => this.themeReports = [] });
        break;

      case 4: // IBTVA - ✅ ENHANCED with Extension Activities
        this.http.get<{
          trainingPrograms: Report[];
          production: ThemeReportByLocation[];
          extensionActivities: ExtensionActivities;
          summary: { totalParticipants: number; totalProductionValue: number };
        }>(`${Endpoints.ibtvReports}?unitId=4&year=${currentYear}&month=${currentMonth}`)
          .subscribe({
            next: (data) => {
              this.reports = data.trainingPrograms || [];
              this.themeReports = data.production || [];
              this.extensionActivities = data.extensionActivities || null; // ✅ NEW
              console.log('Extension Activities:', this.extensionActivities);
            },
            error: () => {
              this.reports = [];
              this.themeReports = [];
              this.extensionActivities = null;
            }
          });
        break;

      case 5: // ATIC
        this.http.get<Report[]>(`${Endpoints.aticReports}?unitId=5&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.reports = data, error: () => this.reports = [] });
        this.http.get<ThemeReportByLocation[]>(`${Endpoints.aticThemeReports}?unitId=5&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.themeReports = data, error: () => this.themeReports = [] });
        break;

      case 6: // DEU
        this.http.get<Report[]>(`${Endpoints.deuReports}?unitId=6&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.reports = data, error: () => this.reports = [] });
        this.http.get<ThemeReportByLocation[]>(`${Endpoints.deuThemeReports}?unitId=6&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.themeReports = data, error: () => this.themeReports = [] });
        break;

      case 7: // ASM
        this.http.get<Report[]>(`${Endpoints.asmReports}?unitId=7&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.reports = data, error: () => this.reports = [] });
        this.http.get<ThemeReportByLocation[]>(`${Endpoints.asmThemeReports}?unitId=7&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.themeReports = data, error: () => this.themeReports = [] });
        break;

      case 8: // NAEP
        this.http.get<Report[]>(`${Endpoints.naepReports}?unitId=8&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.reports = data, error: () => this.reports = [] });
        this.http.get<ThemeReportByLocation[]>(`${Endpoints.naepThemeReports}?unitId=8&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.themeReports = data, error: () => this.themeReports = [] });
        break;

      case 9: // EEU
        this.http.get<Report[]>(`${Endpoints.eeuReports}?unitId=9&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.reports = data, error: () => this.reports = [] });
        this.http.get<ThemeReportByLocation[]>(`${Endpoints.eeuThemeReports}?unitId=9&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.themeReports = data, error: () => this.themeReports = [] });
        break;
      
      case 10: // KVKs
        this.http.get<Report[]>(`${Endpoints.kvkReports}?unitId=10&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.reports = data, error: () => this.reports = [] });
        this.http.get<ThemeReportByLocation[]>(`${Endpoints.kvkThemeReports}?unitId=10&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: data => this.themeReports = data, error: () => this.themeReports = [] });
        break;

      default:
        console.warn('No report endpoint yet for unitId:', this.selectedUnitId);
        this.reports = [];
        this.themeReports = [];
        this.extensionActivities = null;
        this.filteredReports = [];
        this.filteredThemeReports = [];
        this.selectedCategories = [];
        break;
    }
  }

  // ✅ NEW: Helper to check if extension activities have data
  hasExtensionActivitiesData(): boolean {
    if (!this.extensionActivities) return false;
    
    // Check if any activity has data
    return this.extensionActivities.methodSkillDemonstrations.noOfProgrammes > 0 ||
           this.extensionActivities.advisoryServices.faceToFaceContact.total > 0 ||
           this.extensionActivities.visitorsToInstitute.total > 0;
  }

  // ---------------- PDF Download ----------------
  downloadPDF(tableType: 'progress' | 'theme' | 'extension') {
    // 🟢 IBT&VA combined custom PDF with Extension Activities
    if (this.selectedUnitId === 4) {
      const doc = new jsPDF('p', 'pt', 'a4');
      doc.setFontSize(14);
      doc.text('Institute of Baking Technology and Value Addition (IBT & VA)', 40, 40);

      // a) Training Programmes Organized
      doc.setFontSize(12);
      doc.text('a) Training Programmes Organized', 40, 70);
      autoTable(doc, {
        head: [['Sl. No.', 'Date', 'Title', 'Duration', 'No. of Participants']],
        body: this.reports.map((r, i) => [
          i + 1,
          r.date ?? '',
          r.title ?? '',
          r.duration ?? '',
          r.noOfParticipants ?? ''
        ]),
        startY: 90,
        theme: 'grid',
        headStyles: { fillColor: '#FFF9C4', textColor: '#000', fontStyle: 'bold' },
        bodyStyles: { textColor: '#000' }
      });

      // b) Total Production of Bakery and Value Added Products
      let nextY = (doc as any).lastAutoTable.finalY + 30;
      doc.setFontSize(12);
      doc.text('b) Total Production of Bakery and Value Added Products', 40, nextY);

      this.themeReports.forEach((theme, tIndex) => {
        nextY += 20;
        doc.setFontSize(11);
        doc.text(`${tIndex + 1}. ${theme.theme}`, 40, nextY);

        autoTable(doc, {
          head: [['Sl. No.', 'Particulars', 'Quantity', 'Amount (Rs.)']],
          body: theme.items?.map((x, j) => [
            j + 1,
            x.product,
            x.quantity,
            x.amount.toFixed(2)
          ]) || [],
          startY: nextY + 10,
          theme: 'grid',
          headStyles: { fillColor: '#FFF9C4', textColor: '#000', fontStyle: 'bold' },
          bodyStyles: { textColor: '#000' }
        });

        nextY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.text(`Total Amount: ₹${theme.totalAmount?.toFixed(2)}`, 400, nextY);
      });

      // Grand total for production
      const grandTotal = this.themeReports.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      nextY += 20;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Grand Total Production Value: ₹${grandTotal.toFixed(2)}`, 350, nextY);

      // ✅ c) Extension Activities
      if (this.extensionActivities && this.hasExtensionActivitiesData()) {
        nextY += 40;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('c) Extension Activities', 40, nextY);

        const extData: any[][] = [
          [
            '1.',
            'Method/ Skill demonstrations Organized',
            this.extensionActivities.methodSkillDemonstrations.noOfProgrammes,
            this.extensionActivities.methodSkillDemonstrations.noOfParticipants.male,
            this.extensionActivities.methodSkillDemonstrations.noOfParticipants.female,
            this.extensionActivities.methodSkillDemonstrations.noOfParticipants.total
          ],
          [
            '2.',
            'Advisory services - Face to face contact',
            this.extensionActivities.advisoryServices.faceToFaceContact.total,
            this.extensionActivities.advisoryServices.faceToFaceContact.male,
            this.extensionActivities.advisoryServices.faceToFaceContact.female,
            this.extensionActivities.advisoryServices.faceToFaceContact.total
          ],
          [
            '',
            'Advisory services - Telephone calls',
            this.extensionActivities.advisoryServices.telephoneCalls.total,
            this.extensionActivities.advisoryServices.telephoneCalls.male,
            this.extensionActivities.advisoryServices.telephoneCalls.female,
            this.extensionActivities.advisoryServices.telephoneCalls.total
          ],
          [
            '3.',
            'Exposure visits - Organized',
            this.extensionActivities.exposureVisits.organized.noOfProgrammes,
            this.extensionActivities.exposureVisits.organized.participants.male,
            this.extensionActivities.exposureVisits.organized.participants.female,
            this.extensionActivities.exposureVisits.organized.participants.total
          ],
          [
            '',
            'Exposure visits - Participated',
            this.extensionActivities.exposureVisits.participated.noOfProgrammes,
            this.extensionActivities.exposureVisits.participated.participants.male,
            this.extensionActivities.exposureVisits.participated.participants.female,
            this.extensionActivities.exposureVisits.participated.participants.total
          ],
          [
            '4.',
            'Important days - Participated',
            this.extensionActivities.importantDays.participated.noOfProgrammes,
            this.extensionActivities.importantDays.participated.participants.male,
            this.extensionActivities.importantDays.participated.participants.female,
            this.extensionActivities.importantDays.participated.participants.total
          ],
          [
            '5.',
            'Important events - Participated',
            this.extensionActivities.importantEvents.participated.noOfProgrammes,
            this.extensionActivities.importantEvents.participated.participants.male,
            this.extensionActivities.importantEvents.participated.participants.female,
            this.extensionActivities.importantEvents.participated.participants.total
          ],
          [
            '6.',
            'Melas/Exhibitions - Participated',
            this.extensionActivities.melasExhibitions.participated.noOfProgrammes,
            this.extensionActivities.melasExhibitions.participated.participants.male,
            this.extensionActivities.melasExhibitions.participated.participants.female,
            this.extensionActivities.melasExhibitions.participated.participants.total
          ],
          [
            '7.',
            'Visitors to institute',
            this.extensionActivities.visitorsToInstitute.total,
            this.extensionActivities.visitorsToInstitute.male,
            this.extensionActivities.visitorsToInstitute.female,
            this.extensionActivities.visitorsToInstitute.total
          ],
          [
            '8.',
            'WhatsApp queries answered',
            this.extensionActivities.whatsappQueriesAnswered.total,
            this.extensionActivities.whatsappQueriesAnswered.male,
            this.extensionActivities.whatsappQueriesAnswered.female,
            this.extensionActivities.whatsappQueriesAnswered.total
          ],
          [
            '9.',
            'Meeting participated',
            this.extensionActivities.anyOther.meetingParticipated.noOfProgrammes,
            this.extensionActivities.anyOther.meetingParticipated.participants.male,
            this.extensionActivities.anyOther.meetingParticipated.participants.female,
            this.extensionActivities.anyOther.meetingParticipated.participants.total
          ]
        ];

        autoTable(doc, {
          head: [[
            'Sl. No.',
            'Title of the Extension Programme',
            'No of Programmes',
            'Male',
            'Female',
            'Total'
          ]],
          body: extData,
          startY: nextY + 20,
          theme: 'grid',
          headStyles: { fillColor: '#FFF9C4', textColor: '#000', fontStyle: 'bold' },
          bodyStyles: { textColor: '#000' },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 220 },
            2: { cellWidth: 70 },
            3: { cellWidth: 60 },
            4: { cellWidth: 60 },
            5: { cellWidth: 60 }
          }
        });
      }

      doc.save('IBT&VA_MonthlyReport.pdf');
      return;
    }

    // ---------- Generic THEME REPORTS ----------
    const doc = new jsPDF('p', 'pt', 'a4');

    if (tableType === 'theme' && this.themeReports.length > 0) {
      doc.text(
        this.selectedUnitId === 2 ? 'SAMETI' :
        this.selectedUnitId === 3 ? 'FIU Other Activities' :
        this.selectedUnitId === 5 ? 'ATIC Extension Activities' :
        'Theme Report',
        40, 40
      );

      let headers: string[][] = [];
      let data: any[][] = [];

      if (this.selectedUnitId === 2) { // STU
        headers = [['Sl. No.', 'District', 'Completed Batches', 'Input Dealers',
          'Ongoing Batches', 'Input Dealers', 'Started Batches', 'Input Dealers']];
        data = this.themeReports.map((r, i) => [
          i + 1, r.location, r.completedBatches, r.totalParticipants,
          r.ongoingBatches, r.totalParticipants, r.startedBatches, r.totalParticipants
        ]);
      } else if (this.selectedUnitId === 1) { // FTI
        headers = [['Sl. No.', 'Category', 'Collaboration', 'Completed', 'Ongoing', 'Started', 'Total Participants']];
        data = this.themeReports.map((r, i) => [
          i + 1, r.category, r.collaboration,
          r.completedPrograms, r.ongoingPrograms, r.startedPrograms, r.totalParticipants
        ]);
      } else if (this.selectedUnitId === 3) { // FIU
        headers = [['Sl. No.', 'Title', 'Description']];
        data = this.themeReports.map((r, i) => [i + 1, r.title, r.description]);
      } else if (this.selectedUnitId === 5) { // ATIC Extension
        headers = [['Sl. No.', 'Title', 'Category', 'Quantity']];
        data = this.themeReports.map((r, i) => [i + 1, r.title, r.category, r.quantity]);
      } else { // Generic
        headers = [['Sl. No.', 'Category/Location', 'Completed', 'Ongoing', 'Started', 'Total Participants']];
        data = this.themeReports.map((r, i) => [
          i + 1,
          r.category || r.location,
          r.completedBatches || r.completedPrograms,
          r.ongoingBatches || r.ongoingPrograms,
          r.startedBatches || r.startedPrograms,
          r.totalParticipants
        ]);
      }

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 60,
        theme: 'grid',
        headStyles: { fillColor: '#FFF9C4', textColor: '#000', fontStyle: 'bold' },
        bodyStyles: { textColor: '#000' }
      });

      doc.save(`${this.selectedUnitName}_ThemeReport.pdf`);
    }

    // ---------- Generic PROGRESS REPORTS ----------
    if (tableType === 'progress' && this.reports.length > 0) {
      doc.text(
        this.selectedUnitId === 5 ? 'ATIC Sales of Inputs' :
        this.selectedUnitId === 3 ? 'FIU Monthly Report' :
        'Progress of Units', 40, 40
      );

      let headers: string[][] = [];
      let data: any[][] = [];

      if (this.selectedUnitId === 1) { // FTI
        headers = [['Sl. No.', 'Date', 'Title', 'Duration', 'No. of Trainees']];
        data = this.reports.map(r => [r.slNo, r.date, r.title, r.duration, r.noOfTrainees]);
      } else if (this.selectedUnitId === 2) { // STU
        headers = [['Sl. No.', 'Week', 'Date', 'No. of Participants']];
        data = this.reports.map(r => [r.slNo, r.week, r.date, r.noOfParticipants]);
      } else if (this.selectedUnitId === 3) { // FIU
        headers = [['Sl. No.', 'Activity', 'No.']];
        data = this.reports.map(r => [r.slNo, r.activity, r.no]);
      } else if (this.selectedUnitId === 5) { // ATIC
        headers = [['Sl. No.', 'Particulars', 'Unit', 'Quantity', 'Amount (Rs.)', 'Category', 'Theme']];
        data = this.reports.map(r => [r.slNo, r.particulars, r.unit, r.quantity, r.amount, r.category, r.theme]);
      } else {
        headers = [['Sl. No.', 'Date', 'Title', 'No. of Participants']];
        data = this.reports.map(r => [r.slNo, r.date, r.title, r.noOfParticipants || r.noOfTrainees]);
      }

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 70,
        theme: 'grid',
        headStyles: { fillColor: '#FFF9C4', textColor: '#000', fontStyle: 'bold' },
        bodyStyles: { textColor: '#000' }
      });

      doc.save(`${this.selectedUnitName}_Progress.pdf`);
    }
  }
}
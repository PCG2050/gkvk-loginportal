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
}

interface ThemeReportByLocation {
  month?: string;
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
}

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
      return;
    }

    //Convert to number to ensure switch cases work corrrectly
    const unitId = Number(this.selectedUnitId);

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // resolve unit name
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
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.ftiThemeReports}?unitId=1&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      case 2: // STU
        this.http.get<Report[]>(`${Endpoints.stuReports}?unitId=2`)
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.stuThemeReportsByLocation}?unitId=2`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      case 3: // Farm Information Unit
        this.http.get<Report[]>(`${Endpoints.fiuReports}?unitId=3&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.fiuThemeReports}?unitId=3&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      case 4: // IBTV
        this.http.get<Report[]>(`${Endpoints.ibtvReports}?unitId=4&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.ibtvThemeReports}?unitId=4&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      case 5: // ATIC
        this.http.get<Report[]>(`${Endpoints.aticReports}?unitId=5&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.aticThemeReports}?unitId=5&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      case 6: // DEU
        this.http.get<Report[]>(`${Endpoints.deuReports}?unitId=6&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.deuThemeReports}?unitId=6&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      case 7: // ASM
        this.http.get<Report[]>(`${Endpoints.asmReports}?unitId=7&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.asmThemeReports}?unitId=7&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      case 8: // NAEP
        this.http.get<Report[]>(`${Endpoints.naepReports}?unitId=8&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.naepThemeReports}?unitId=8&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      case 9: // EEUs
        this.http.get<Report[]>(`${Endpoints.eeuReports}?unitId=9&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.eeuThemeReports}?unitId=9&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      case 10: // KVKs
        this.http.get<Report[]>(`${Endpoints.kvkReports}?unitId=10&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.reports = data; }, error: () => { this.reports = [] } });

        this.http.get<ThemeReportByLocation[]>(`${Endpoints.kvkThemeReports}?unitId=10&year=${currentYear}&month=${currentMonth}`)
          .subscribe({ next: (data) => { this.themeReports = data; }, error: () => { this.themeReports = [] } });
        break;

      default:
        console.warn('No report endpoint yet for unitId:', this.selectedUnitId);
        this.reports = [];
        this.themeReports = [];
        break;
    }
  }

  downloadPDF(tableType: 'progress' | 'theme') {
    const doc = new jsPDF('p', 'pt', 'a4');

    if (tableType === 'progress' && this.reports.length > 0) {
      doc.text('Progress of Units', 40, 40);
      doc.text(`${this.selectedUnitName}, GKVK`, 40, 60);

      let headers: string[][] = [];
      let data: any[][] = [];

      if (this.selectedUnitId === 2) { // STU
        headers = [['Sl. No.', 'Week', 'Date', 'No. of Participants']];
        data = this.reports.map(r => [r.slNo, r.week, r.date, r.noOfParticipants]);
      } else if (this.selectedUnitId === 1) { // FTI
        headers = [['Sl. No.', 'Date', 'Title', 'Duration', 'No. of Trainees']];
        data = this.reports.map(r => [r.slNo, r.date, r.title, r.duration, r.noOfTrainees]);
      } else { // Generic
        headers = [['Sl. No.', 'Date', 'Title', 'No. of Participants']];
        data = this.reports.map(r => [r.slNo, r.date, r.title, r.noOfParticipants || r.noOfTrainees]);
      }

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 80,
        theme: 'grid',
        headStyles: { fillColor: '#FFF9C4', textColor: '#000000', fontStyle: 'bold' },
        bodyStyles: { textColor: '#000000' }
      });

      doc.save(`${this.selectedUnitName}_Progress.pdf`);
    }

    if (tableType === 'theme' && this.themeReports.length > 0) {
      doc.text(this.selectedUnitId === 2 ? 'SAMETI' : 'Theme Report', 40, 40);

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
        headStyles: { fillColor: '#FFF9C4', textColor: '#000000', fontStyle: 'bold' },
        bodyStyles: { textColor: '#000000' }
      });

      doc.save(`${this.selectedUnitName}_ThemeReport.pdf`);
    }
  }
}

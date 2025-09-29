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
  week: number;
  date: string;
  noOfParticipants: number;
  batch: number;
  tpNo: number;
  theme: string;
}

interface ThemeReportByLocation {
  month: string;
  location: string;
  theme: string;
  type?: string;
  category: string;
  completedBatches: number;
  ongoingBatches: number;
  startedBatches: number;
  totalParticipants: number;
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
  selectedUnitId: string = '';
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
    if (!this.selectedUnitId) {
      this.reports = [];
      this.themeReports = [];
      return;
    }

    // Fetch main report
    this.http.get<Report[]>(`${Endpoints.stuReports}?unitId=${this.selectedUnitId}`)
      .subscribe({
        next: (data) => { this.reports = data; },
        error: () => { this.reports = []; }
      });

    // Fetch theme report
    this.http.get<ThemeReportByLocation[]>(`${Endpoints.stuThemeReportsByLocation}?unitId=${this.selectedUnitId}`)
      .subscribe({
        next: (data) => { this.themeReports = data; },
        error: () => { this.themeReports = []; }
      });
  }

  downloadPDF(tableType: 'progress' | 'theme') {
    const doc = new jsPDF('p', 'pt', 'a4');

    if (tableType === 'progress' && this.reports.length > 0) {
      doc.text('Progress of Units', 40, 40);
      doc.text('Staff Training Unit (STU), GKVK', 40, 60);

      const headers = [['Sl. No.', 'Week', 'Date', 'No. of Participants']];
      const data = this.reports.map(r => [r.slNo, r.week, r.date, r.noOfParticipants]);

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 80,
        theme: 'grid',
        headStyles: {
          fillColor: '#FFF9C4', // Light yellow
          textColor: '#000000', // Black text
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: '#000000'
        }
      });

      doc.save('Progress_of_Units.pdf');
    }

    if (tableType === 'theme' && this.themeReports.length > 0) {
      doc.text('SAMETI', 40, 40);

      const headers = [
        ['Sl. No.', 'District', 'Completed Batches', 'Input Dealers', 'Ongoing Batches', 'Input Dealers', 'Started Batches', 'Input Dealers']
      ];

      const data = this.themeReports.map((r, i) => [
        i + 1,
        r.location,
        r.completedBatches,
        r.totalParticipants,
        r.ongoingBatches,
        r.totalParticipants,
        r.startedBatches,
        r.totalParticipants
      ]);

      autoTable(doc, {
        head: headers,
        body: data,
        startY: 60,
        theme: 'grid',
         headStyles: {
        fillColor: '#FFF9C4', // Light yellow
        textColor: '#000000', // Black text
        fontStyle: 'bold'
      },
      bodyStyles: {
        textColor: '#000000'
      }
      });

      doc.save('SAMETI_Report.pdf');
    }
  }
}

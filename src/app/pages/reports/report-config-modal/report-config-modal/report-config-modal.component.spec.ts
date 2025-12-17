import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReportConfigModalComponent } from './report-config-modal.component';

describe('ReportConfigModalComponent', () => {
  let component: ReportConfigModalComponent;
  let fixture: ComponentFixture<ReportConfigModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReportConfigModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportConfigModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

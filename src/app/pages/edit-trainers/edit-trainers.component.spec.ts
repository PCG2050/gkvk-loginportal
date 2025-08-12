import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditTrainersComponent } from './edit-trainers.component';

describe('EditTrainersComponent', () => {
  let component: EditTrainersComponent;
  let fixture: ComponentFixture<EditTrainersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditTrainersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditTrainersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

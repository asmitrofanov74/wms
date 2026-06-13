import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render KPI cards', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.kpi-grid')).toBeTruthy();
    expect(compiled.querySelectorAll('.kpi-card').length).toBe(4);
  });

  it('should display Products KPI', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const kpiLabels = Array.from(compiled.querySelectorAll('.kpi-label')).map(el => el.textContent);
    expect(kpiLabels).toContain('Products');
    expect(kpiLabels).toContain('Receiving Today');
    expect(kpiLabels).toContain('Shipping Today');
    expect(kpiLabels).toContain('Low Stock Alerts');
  });

  it('should render pending tasks card', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.dashboard-grid')).toBeTruthy();
    expect(compiled.querySelectorAll('.dashboard-card').length).toBe(2);
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificadoPertenencia } from './certificado-pertenencia';

describe('CertificadoPertenencia', () => {
  let component: CertificadoPertenencia;
  let fixture: ComponentFixture<CertificadoPertenencia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificadoPertenencia]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificadoPertenencia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

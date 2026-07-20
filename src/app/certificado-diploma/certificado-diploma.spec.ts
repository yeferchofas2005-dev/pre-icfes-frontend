import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificadoDiploma } from './certificado-diploma';

describe('CertificadoDiploma', () => {
  let component: CertificadoDiploma;
  let fixture: ComponentFixture<CertificadoDiploma>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificadoDiploma]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificadoDiploma);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

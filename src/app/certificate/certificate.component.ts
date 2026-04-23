import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-certificate',
  standalone: true,
  templateUrl: './certificate.component.html',
  styleUrls: ['./certificate.component.css']
})
export class CertificateComponent implements OnChanges {
  @Input() nombre: string = '';
  @Input() documento: string = '';
  @Input() nodo: string = '';
  @Input() tipoDocumento: string = '';
  @Input() direccion: string = '';
  @Input() coordinador: string = '';

  currentDate: string = '';
  day: string = '';
  month: string = '';
  year: string = '';
  tipoDocumentoLabel: string = '';

  constructor() {
    const now = new Date();
    this.currentDate = now.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    this.day = now.getDate().toString();
    this.month = now.toLocaleDateString('es-ES', { month: 'long' });
    this.year = now.getFullYear().toString();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['tipoDocumento']) {
      this.tipoDocumentoLabel = this.getTipoDocumentoLabel(this.tipoDocumento);
    }
    console.log('CertificateComponent - ngOnChanges:', {
      nombre: this.nombre,
      documento: this.documento,
      nodo: this.nodo,
      tipoDocumento: this.tipoDocumento,
      tipoDocumentoLabel: this.tipoDocumentoLabel
    });
  }

  getTipoDocumentoLabel(tipo: string): string {
    const tipoUpper = tipo.toUpperCase();
    switch (tipoUpper) {
      case 'CC': return 'Cédula de Ciudadanía';
      case 'TI': return 'Tarjeta de Identidad';
      case 'CE': return 'Cédula de Extranjería';
      default: return 'Documento de Identidad';
    }
  }

  downloadPDF() {
    const element = document.getElementById('certificate-content');
    if (element) {
      html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save('certificado.pdf');
      });
    }
  }
}
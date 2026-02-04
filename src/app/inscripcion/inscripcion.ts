import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InscripcionService, InscripcionData } from '../services/inscripcion';

@Component({
  selector: 'app-inscripcion',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './inscripcion.html',
  styleUrl: './inscripcion.css',
})
export class Inscripcion {
  inscripcionForm: FormGroup;
  currentStep: number = 0;
  isSubmitting: boolean = false;
  documentoBase64: string | null = null;
  consentimientoBase64: string | null = null;
  
  steps = [
    { title: 'Preinscripción PreICFES Gratuito 2025', fields: [] },
    { title: 'Aviso de Privacidad', fields: ['aceptaPrivacidad'] },
    { title: 'Datos Personales', fields: ['nombreCompleto', 'tipoDocumento', 'numeroDocumento', 'documentoIdentidad', 'fechaNacimiento', 'comunidad', 'genero', 'estrato', 'celular', 'correo', 'eps'] },
    { title: 'Contacto en caso de Emergencia', fields: ['nombreContactoEmergencia', 'parentezcoContactoEmergencia', 'numeroContactoEmergencia', 'correoContactoEmergencia'] },
    { title: 'CONSENTIMIENTO INFORMADO PARA BENEFICIARI@S MAYORES DE EDAD', fields: ['consentimientoInformado'] },
    { title: 'Localidad y Nodo', fields: ['localidadResidencia', 'nodoPreferido'] },
    { title: 'Información Educativa', fields: ['cursandoGrado11', 'razonParticipar', 'institucionSuperior'] },
    { title: 'Simulacro', fields: ['dispuestoPagarSimulacro'] },
    { title: 'Información Adicional', fields: ['comoSeEntero'] }
  ];

  tiposDocumento = [
    'Tarjeta de Identidad',
    'Cédula de Ciudadanía',
    'Pasaporte',
    'DNI extranjero'
  ];

  comunidades = [
    'Comunidades N.A.R.P (Negras, Afrocolombianas, Raizales y Palenqueras)',
    'Comunidades Indígenas',
    'Rrom y/o Gitanos',
    'Víctimas del Conflicto Armado',
    'Jóvenes Rurales o Campesinos',
    'Comunidades LGBTIQ+',
    'Ninguna de las anteriores'
  ];

  generos = [
    'Hombre',
    'Mujer',
    'Prefiero no decirlo'
  ];

  estratos = ['1', '2', '3', '4', '5', '6'];

  parentezcos = [
    'Madre',
    'Padre',
    'Hermano/a',
    'Referencia Personal',
    'Otro'
  ];

  localidadesBogota = [
    'Usaquén',
    'Chapinero',
    'Santa Fe',
    'San Cristóbal',
    'Usme',
    'Tunjuelito',
    'Bosa',
    'Kennedy',
    'Fontibón',
    'Engativá',
    'Suba',
    'Barrios Unidos',
    'Teusaquillo',
    'Los Mártires',
    'Antonio Nariño',
    'Puente Aranda',
    'La Candelaria',
    'Rafael Uribe Uribe',
    'Ciudad Bolívar',
    'Sumapaz',
    'Soacha'
  ];

  nodos = [
    'Fontibón - Centro de Desarrollo Comunitario "La Giralda"',
    'San Cristóbal - Lugar por Confirmar',
    'Kennedy - Colegio INEM de Kennedy',
    'Bosa - Universidad Distrital Sede Bosa Porvenir',
    'Centro - Universidad Nacional de Colombia - Sede Bogotá',
    'Usme - Centro de Desarrollo Comunitario Julio Cesar Sánchez',
    '(Ciudad Bolívar - Soacha) - Universidad Uniminuto Sede Perdomo',
    'Engativá - Sede por Confirmar - Condicionado a la cantidad de inscripciones',
    'Suba - Sede por Confirmar - Condicionado a la cantidad de inscripciones',
    '(Modalidad Virtual) - Universidad Nacional'
  ];

  tiposColegio = [
    'Sí, Colegio Público',
    'Sí, Colegio Privado',
    'No'
  ];

  instituciones = [
    'Universidad Nacional de Colombia (UN)',
    'Universidad Distrital Francisco José de Caldas (UD)',
    'Universidad Pedagógica Nacional (UPN)',
    'Universidad Colegio Mayor de Cundinamarca (UCMC)',
    'Universidad Pedagógica Tecnológica de Colombia (UPTC)',
    'Escuela Superior de Administración Pública (ESAP)',
    'Servicio Nacional de Aprendizaje (SENA)',
    'Otro'
  ];

  disposicionSimulacro = ['Sí', 'No'];

  comoSeEntero = [
    'Redes Sociales',
    'Consejo de Juventud',
    'Un amigo/a',
    'Otro'
  ];

  constructor(
    private fb: FormBuilder,
    private inscripcionService: InscripcionService,
    private cdr: ChangeDetectorRef
  ) {
    this.inscripcionForm = this.fb.group({
      // Aviso de privacidad
      aceptaPrivacidad: [false, Validators.requiredTrue],
      
      // Datos personales
      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      documentoIdentidad: [null, Validators.required],
      fechaNacimiento: ['', Validators.required],
      comunidad: ['', Validators.required],
      genero: ['', Validators.required],
      estrato: ['', Validators.required],
      celular: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      eps: ['', Validators.required],
      
      // Contacto emergencia
      nombreContactoEmergencia: ['', Validators.required],
      parentezcoContactoEmergencia: ['', Validators.required],
      parentezcoOtro: [''],
      numeroContactoEmergencia: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      correoContactoEmergencia: ['', [Validators.required, Validators.email]],
      
      // Consentimiento informado
      consentimientoInformado: [null, Validators.required],
      
      // Localidad y nodo
      localidadResidencia: ['', Validators.required],
      ciudadOrigen: [''],
      nodoPreferido: ['', Validators.required],
      
      // Información educativa
      cursandoGrado11: ['', Validators.required],
      nombreInstitucion: [''],
      contactoInstitucion: [''],
      razonParticipar: ['', Validators.required],
      inscritoSaber11: ['', Validators.required],
      queEstudiar: [''],
      institucionSuperior: ['', Validators.required],
      
      // Simulacro
      dispuestoPagarSimulacro: ['', Validators.required],
      comoSeEntero: ['', Validators.required]
    });

    // Validaciones condicionales
    this.inscripcionForm.get('parentezcoContactoEmergencia')?.valueChanges.subscribe(val => {
      if (val === 'Otro') {
        this.inscripcionForm.get('parentezcoOtro')?.setValidators([Validators.required]);
      } else {
        this.inscripcionForm.get('parentezcoOtro')?.clearValidators();
      }
      this.inscripcionForm.get('parentezcoOtro')?.updateValueAndValidity();
    });

    this.inscripcionForm.get('cursandoGrado11')?.valueChanges.subscribe(val => {
      if (val === 'Sí, Colegio Público' || val === 'Sí, Colegio Privado') {
        this.inscripcionForm.get('nombreInstitucion')?.setValidators([Validators.required]);
        this.inscripcionForm.get('contactoInstitucion')?.setValidators([Validators.required]);
      } else {
        this.inscripcionForm.get('nombreInstitucion')?.clearValidators();
        this.inscripcionForm.get('contactoInstitucion')?.clearValidators();
      }
      this.inscripcionForm.get('nombreInstitucion')?.updateValueAndValidity();
      this.inscripcionForm.get('contactoInstitucion')?.updateValueAndValidity();
    });

    this.inscripcionForm.get('nodoPreferido')?.valueChanges.subscribe(val => {
      if (val === '(Modalidad Virtual) - Universidad Nacional') {
        this.inscripcionForm.get('ciudadOrigen')?.setValidators([Validators.required]);
      } else {
        this.inscripcionForm.get('ciudadOrigen')?.clearValidators();
      }
      this.inscripcionForm.get('ciudadOrigen')?.updateValueAndValidity();
    });
  }

  onFileChange(event: any, field: string) {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        // Convertir el archivo a base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1]; // Obtener solo la parte base64
          
          if (field === 'documentoIdentidad') {
            this.documentoBase64 = base64String;
          } else if (field === 'consentimientoInformado') {
            this.consentimientoBase64 = base64String;
          }
          
          // Actualizar el formulario para marcar como válido
          this.inscripcionForm.patchValue({
            [field]: file
          });
          
          // Forzar detección de cambios para evitar NG0100
          this.cdr.detectChanges();
        };
        reader.onerror = () => {
          alert('Error al leer el archivo');
          event.target.value = '';
        };
        reader.readAsDataURL(file);
      } else {
        alert('Por favor, sube un archivo PDF');
        event.target.value = '';
      }
    }
  }
  
  

  onSubmit() {
    if (this.inscripcionForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      
      // Preparar los datos para enviar
      const formData = this.inscripcionForm.value;
      const inscripcionData: InscripcionData = {
        aceptaPrivacidad: formData.aceptaPrivacidad,
        nombreCompleto: formData.nombreCompleto,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        documentoIdentidad: formData.documentoIdentidad,
        fechaNacimiento: formData.fechaNacimiento,
        comunidad: formData.comunidad,
        genero: formData.genero,
        estrato: formData.estrato,
        celular: formData.celular,
        correo: formData.correo,
        eps: formData.eps,
        nombreContactoEmergencia: formData.nombreContactoEmergencia,
        parentezcoContactoEmergencia: formData.parentezcoContactoEmergencia,
        parentezcoOtro: formData.parentezcoOtro || '',
        numeroContactoEmergencia: formData.numeroContactoEmergencia,
        correoContactoEmergencia: formData.correoContactoEmergencia,
        consentimientoInformado: formData.consentimientoInformado,
        localidadResidencia: formData.localidadResidencia,
        ciudadOrigen: formData.ciudadOrigen || '',
        nodoPreferido: formData.nodoPreferido,
        cursandoGrado11: formData.cursandoGrado11,
        nombreInstitucion: formData.nombreInstitucion || '',
        contactoInstitucion: formData.contactoInstitucion || '',
        razonParticipar: formData.razonParticipar,
        inscritoSaber11: formData.inscritoSaber11,
        queEstudiar: formData.queEstudiar || '',
        institucionSuperior: formData.institucionSuperior,
        dispuestoPagarSimulacro: formData.dispuestoPagarSimulacro,
        comoSeEntero: formData.comoSeEntero
      };

      // Enviar datos a Google Sheets con FormData y archivos en base64
      this.inscripcionService.enviarInscripcion(inscripcionData, this.documentoBase64, this.consentimientoBase64).subscribe({
        next: (response) => {
          console.log('Datos enviados exitosamente:', response);
          console.log('Datos enviados:', inscripcionData);
          alert('¡Formulario enviado exitosamente! Te contactaremos pronto.');
          this.inscripcionForm.reset();
          this.currentStep = 0;
          this.isSubmitting = false;
        },
        error: (error) => {
          console.error('Error completo:', error);
          console.error('Datos que se intentaron enviar:', inscripcionData);
          const errorMessage = error?.error || error?.message || 'Error desconocido';
          alert(`Hubo un error al enviar el formulario: ${errorMessage}. Por favor, intenta nuevamente o contacta con nosotros.`);
          this.isSubmitting = false;
        }
      });
    } else {
      this.inscripcionForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos correctamente.');
      this.isSubmitting = false;
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.inscripcionForm.get(fieldName);
    if (field?.hasError('required') && field?.touched) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('email') && field?.touched) {
      return 'Ingresa un correo válido';
    }
    if (field?.hasError('pattern') && field?.touched) {
      return 'Formato inválido';
    }
    if (field?.hasError('minlength') && field?.touched) {
      return 'Mínimo 3 caracteres';
    }
    return '';
  }

  validateCurrentStep(): boolean {
    const currentStepFields = this.steps[this.currentStep].fields;
    let isValid = true;

    currentStepFields.forEach(fieldName => {
      const field = this.inscripcionForm.get(fieldName);
      if (field && field.invalid) {
        field.markAsTouched();
        isValid = false;
      }
    });

    // Validaciones especiales para campos condicionales
    if (this.currentStep === 3) { // Contacto Emergencia
      if (this.inscripcionForm.get('parentezcoContactoEmergencia')?.value === 'Otro') {
        const parentezcoOtro = this.inscripcionForm.get('parentezcoOtro');
        if (parentezcoOtro && parentezcoOtro.invalid) {
          parentezcoOtro.markAsTouched();
          isValid = false;
        }
      }
    }

    if (this.currentStep === 5) { // Localidad y Nodo
      if (this.inscripcionForm.get('nodoPreferido')?.value === '(Modalidad Virtual) - Universidad Nacional') {
        const ciudadOrigen = this.inscripcionForm.get('ciudadOrigen');
        if (ciudadOrigen && ciudadOrigen.invalid) {
          ciudadOrigen.markAsTouched();
          isValid = false;
        }
      }
    }

    if (this.currentStep === 6) { // Información Educativa
      const cursandoGrado11 = this.inscripcionForm.get('cursandoGrado11')?.value;
      if (cursandoGrado11 === 'Sí, Colegio Público' || cursandoGrado11 === 'Sí, Colegio Privado') {
        const nombreInstitucion = this.inscripcionForm.get('nombreInstitucion');
        const contactoInstitucion = this.inscripcionForm.get('contactoInstitucion');
        if (nombreInstitucion && nombreInstitucion.invalid) {
          nombreInstitucion.markAsTouched();
          isValid = false;
        }
        if (contactoInstitucion && contactoInstitucion.invalid) {
          contactoInstitucion.markAsTouched();
          isValid = false;
        }
      }
    }

    return isValid;
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      if (this.currentStep < this.steps.length - 1) {
        this.currentStep++;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      alert('Por favor, completa todos los campos requeridos antes de continuar.');
    }
  }

  previousStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  goToStep(step: number) {
    if (step >= 0 && step < this.steps.length) {
      this.currentStep = step;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  isStepValid(stepIndex: number): boolean {
    const stepFields = this.steps[stepIndex].fields;
    return stepFields.every(fieldName => {
      const field = this.inscripcionForm.get(fieldName);
      return !field || field.valid;
    });
  }
}
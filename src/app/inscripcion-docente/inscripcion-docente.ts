import { Component, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InscripcionService, InscripcionDocenteData } from '../services/inscripcion';

@Component({
  selector: 'app-inscripcion-docente',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './inscripcion-docente.html',
  styleUrl: './inscripcion-docente.css',
})
export class InscripcionDocente {
  inscripcionDocenteForm: FormGroup;
  currentStep: number = 0;
  isSubmitting: boolean = false;

  hojaVidaBase64: string | null = null;

  steps = [
    { title: 'Preinscripción Docentes Voluntari@s 2025', fields: [] },
    { title: 'Información importante', fields: ['aceptaCondicionesVoluntariado'] },
    { title: 'Aviso de Privacidad', fields: ['aceptaPrivacidad'] },
    {
      title: 'Datos Personales',
      fields: [
        'nombreCompleto',
        'tipoDocumento',
        'numeroDocumento',
        'celular',
        'correo',
        'fechaNacimiento',
        'localidadResidencia',
        'genero'
      ]
    },
    {
      title: 'Formación y experiencia',
      fields: ['nivelFormacion', 'profesionOcupacion', 'institucionSuperior', 'hojaVida']
    },
    {
      title: 'Disponibilidad y área',
      fields: ['tieneSituacionPendiente', 'areasConocimiento', 'modalidades', 'nodosDisponibles']
    },
    { title: 'Redes Sociales', fields: [] }
  ];

  tiposDocumento = ['Cédula de Ciudadanía', 'Pasaporte', 'DNI extranjero'];

  generos = ['Hombre', 'Mujer', 'Prefiero no decirlo'];

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

  nivelesFormacion = [
    'Semestre 1 al 4',
    'Semestre 4 al 8',
    'Semestre 8 al 10',
    'Terminó materias, pero aún no está titulado',
    'Titulo Profesional'
  ];

  instituciones = [
    'Universidad Nacional de Colombia (UN)',
    'Universidad Distrital Francisco José de Caldas (UD)',
    'Universidad Pedagógica Nacional (UPN)',
    'Universidad Colegio Mayor de Cundinamarca (UCMC)',
    'Escuela Superior de Administración Pública (ESAP)',
    'Servicio Nacional de Aprendizaje (SENA)',
    'Otro'
  ];

  areas = [
    'Matemáticas',
    'Lectura Crítica',
    'Sociales y Ciudadanías',
    'Química',
    'Física',
    'Biología',
    'Inglés',
    'Asesoría Vocacional',
    'Cátedra de estudios Afrocolombianos, Paz y DDHH'
  ];

  modalidades = [
    'Modalidad virtual [Martes 6 p.m a 8 p.m - Con cámara y micrófono encendidos] - Microsoft Teams',
    'Modalidad virtual [Jueves 6 p.m a 8 p.m - Con cámara y micrófono encendidos] - Microsoft Teams',
    'Modalidad presencial [Sábados en la mañana (8 a.m a 10 a.m 1er módulo)]',
    'Modalidad presencial [Sábados en la mañana (10:15 a.m a 12:15 p.m 2do módulo)]',
    'Modalidad Presencial [Sábado 2:00 p.m a 4:00 p.m]',
    'Modalidad Presencial [Sábado 4:00 p.m a 6:00 p.m]'
  ];

  nodos = [
    'Universidad Nacional de Colombia (Sede Bogotá) - 8am a 12pm',
    'Fontibón - (CDC La Giralda) - 8am a 12pm',
    'Suba - Compensar Suba - 8am a 12pm',
    'Ciudad Bolívar - Soacha - (Sede Uniminuto) - 2pm a 6pm',
    'Bosa - (Universidad Distrital - Sede Porvenir) - 8am a 12pm',
    'Kennedy - (INEM de Kennedy) - 8am a 12pm',
    'Usme  - (CDC Julio César Sánchez) - 8am a 12pm',
    'Engativá - (Colegio Manuela Ayala Gaitán) - 8am a 12pm',
    'San Cristobal - (Urbanización Alta vista) - 2pm a 6pm',
    'Nodo Virtual - (Microsoft Teams) - Martes y Jueves - 7pm a 9pm'
  ];

  constructor(
    private fb: FormBuilder,
    private inscripcionService: InscripcionService,
    private cdr: ChangeDetectorRef
  ) {
    this.inscripcionDocenteForm = this.fb.group({
      aceptaCondicionesVoluntariado: [false, Validators.requiredTrue],
      aceptaPrivacidad: [false, Validators.requiredTrue],

      nombreCompleto: ['', [Validators.required, Validators.minLength(3)]],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]],
      celular: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      correo: ['', [Validators.required, Validators.email]],
      fechaNacimiento: ['', Validators.required],
      localidadResidencia: ['', Validators.required],
      genero: ['', Validators.required],

      nivelFormacion: ['', Validators.required],
      profesionOcupacion: ['', Validators.required],
      institucionSuperior: ['', Validators.required],
      institucionSuperiorOtra: [''],
      hojaVida: [null, Validators.required],

      tieneSituacionPendiente: ['', Validators.required],
      areasConocimiento: [[], [Validators.required, Validators.minLength(1)]],
      modalidades: [[], [Validators.required, Validators.minLength(1)]],
      nodosDisponibles: [[], [Validators.required, Validators.minLength(1)]],
    });

    this.inscripcionDocenteForm.get('institucionSuperior')?.valueChanges.subscribe(val => {
      if (val === 'Otro') {
        this.inscripcionDocenteForm.get('institucionSuperiorOtra')?.setValidators([Validators.required]);
      } else {
        this.inscripcionDocenteForm.get('institucionSuperiorOtra')?.clearValidators();
      }
      this.inscripcionDocenteForm.get('institucionSuperiorOtra')?.updateValueAndValidity();
    });
  }

  onFileChange(event: any, field: string) {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/pdf') {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = (reader.result as string).split(',')[1];

          if (field === 'hojaVida') {
            this.hojaVidaBase64 = base64String;
          }

          this.inscripcionDocenteForm.patchValue({
            [field]: file
          });

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

  onCheckboxArrayChange(event: any, field: string) {
    const control = this.inscripcionDocenteForm.get(field);
    if (!control) return;

    const currentValue = (control.value || []) as string[];
    const value = event.target.value as string;
    const checked = !!event.target.checked;

    if (checked) {
      if (!currentValue.includes(value)) {
        control.setValue([...currentValue, value]);
      }
    } else {
      control.setValue(currentValue.filter(v => v !== value));
    }

    control.markAsTouched();
  }

  onSubmit() {
    if (this.inscripcionDocenteForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formData = this.inscripcionDocenteForm.value;
      const inscripcionDocenteData: InscripcionDocenteData = {
        tipoFormulario: 'docente',
        aceptaCondicionesVoluntariado: formData.aceptaCondicionesVoluntariado,
        aceptaPrivacidad: formData.aceptaPrivacidad,

        nombreCompleto: formData.nombreCompleto,
        tipoDocumento: formData.tipoDocumento,
        numeroDocumento: formData.numeroDocumento,
        celular: formData.celular,
        correo: formData.correo,
        fechaNacimiento: formData.fechaNacimiento,
        localidadResidencia: formData.localidadResidencia,
        genero: formData.genero,

        nivelFormacion: formData.nivelFormacion,
        profesionOcupacion: formData.profesionOcupacion,
        institucionSuperior: formData.institucionSuperior,
        institucionSuperiorOtra: formData.institucionSuperiorOtra || '',
        hojaVida: formData.hojaVida,

        tieneSituacionPendiente: formData.tieneSituacionPendiente,
        areasConocimiento: formData.areasConocimiento,
        modalidades: formData.modalidades,
        nodosDisponibles: formData.nodosDisponibles,
      };

      this.inscripcionService.enviarInscripcionDocente(inscripcionDocenteData, this.hojaVidaBase64).subscribe({
        next: (response: unknown) => {
          console.log('Docente enviado exitosamente:', response);
          console.log('Datos enviados:', inscripcionDocenteData);
          alert('¡Formulario enviado exitosamente! Te contactaremos pronto.');
          this.inscripcionDocenteForm.reset();
          this.currentStep = 0;
          this.isSubmitting = false;
        },
        error: (error: any) => {
          console.error('Error completo:', error);
          console.error('Datos que se intentaron enviar:', inscripcionDocenteData);
          const errorMessage = error?.error || error?.message || 'Error desconocido';
          alert(`Hubo un error al enviar el formulario: ${errorMessage}. Por favor, intenta nuevamente o contacta con nosotros.`);
          this.isSubmitting = false;
        }
      });
    } else {
      this.inscripcionDocenteForm.markAllAsTouched();
      alert('Por favor, completa todos los campos requeridos correctamente.');
      this.isSubmitting = false;
    }
  }

  getFieldError(fieldName: string): string {
    const field = this.inscripcionDocenteForm.get(fieldName);
    if (field?.hasError('required') && field?.touched) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('requiredTrue') && field?.touched) {
      return 'Debes aceptar para continuar';
    }
    if (field?.hasError('email') && field?.touched) {
      return 'Ingresa un correo válido';
    }
    if (field?.hasError('pattern') && field?.touched) {
      return 'Formato inválido';
    }
    if (field?.hasError('minlength') && field?.touched) {
      return 'Selecciona al menos una opción';
    }
    return '';
  }

  validateCurrentStep(): boolean {
    const currentStepFields = this.steps[this.currentStep].fields;
    let isValid = true;

    currentStepFields.forEach(fieldName => {
      const field = this.inscripcionDocenteForm.get(fieldName);
      if (field && field.invalid) {
        field.markAsTouched();
        isValid = false;
      }
    });

    if (this.currentStep === 4) {
      if (this.inscripcionDocenteForm.get('institucionSuperior')?.value === 'Otro') {
        const otro = this.inscripcionDocenteForm.get('institucionSuperiorOtra');
        if (otro && otro.invalid) {
          otro.markAsTouched();
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
      const field = this.inscripcionDocenteForm.get(fieldName);
      return !field || field.valid;
    });
  }
}

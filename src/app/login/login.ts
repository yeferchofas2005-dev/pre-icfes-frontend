import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;
  errorMessage: string | null = null;
  isSubmitting = false;

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = null;

    // Simular un retraso corto para experiencia de carga premium
    setTimeout(() => {
      const email = this.loginForm.value.email.toLowerCase().trim();
      
      if (email === 'estudiante@mail.com') {
        this.router.navigate(['/panel-estudiante']);
      } else if (email === 'docente@mail.com' || email === 'profesor@mail.com') {
        this.router.navigate(['/panel-docente']);
      } else if (email === 'admin@mail.com' || email === 'administrativo@mail.com') {
        this.router.navigate(['/panel-admin']);
      } else {
        this.errorMessage = 'Credenciales no reconocidas. Usa una de las cuentas de demostración abajo.';
      }
      this.isSubmitting = false;
    }, 800);
  }

  setDemoCredentials(role: string): void {
    let email = '';
    if (role === 'estudiante') {
      email = 'estudiante@mail.com';
    } else if (role === 'docente') {
      email = 'profesor@mail.com';
    } else if (role === 'admin') {
      email = 'admin@mail.com';
    }
    
    this.loginForm.patchValue({
      email: email,
      password: 'demo1234'
    });
    this.errorMessage = null;
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.hasError('required') && field?.touched) {
      return 'Este campo es obligatorio';
    }
    if (field?.hasError('email') && field?.touched) {
      return 'Ingresa un correo válido';
    }
    if (field?.hasError('minlength') && field?.touched) {
      return 'Mínimo 4 caracteres';
    }
    return '';
  }
}


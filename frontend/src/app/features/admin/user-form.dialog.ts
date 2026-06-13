import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from './admin.service';
import { User, Role } from '../../shared/models/api-response';

interface DialogData {
  user?: User;
  roles: Role[];
}

@Component({
  selector: 'app-user-form-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.user ? 'Edit User' : 'Add User' }}</h2>

    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Email</mat-label>
          <input matInput type="email" [(ngModel)]="form.email" required>
        </mat-form-field>

        @if (!data.user) {
          <mat-form-field appearance="outline">
            <mat-label>Password</mat-label>
            <input matInput type="password" [(ngModel)]="form.password" required>
          </mat-form-field>
        }

        <mat-form-field appearance="outline">
          <mat-label>First Name</mat-label>
          <input matInput [(ngModel)]="form.firstName" required>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Last Name</mat-label>
          <input matInput [(ngModel)]="form.lastName" required>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Roles</mat-label>
          <mat-select [(ngModel)]="form.roleIds" multiple>
            @for (r of data.roles; track r.id) {
              <mat-option [value]="r.id">{{ r.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </div>

      @if (error()) {
        <div class="error-msg">{{ error() }}</div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || !valid()">
        @if (saving()) {
          <mat-spinner diameter="20"/>
        }
        {{ data.user ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
  `],
})
export class UserFormDialog implements OnInit {
  private admin = inject(AdminService);
  private dialogRef = inject(MatDialogRef<UserFormDialog>);
  private snackBar = inject(MatSnackBar);
  data: DialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  error = signal('');

  form: { email: string; password: string; firstName: string; lastName: string; roleIds: string[] } = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleIds: [],
  };

  ngOnInit(): void {
    if (this.data.user) {
      this.form.email = this.data.user.email;
      this.form.firstName = this.data.user.firstName;
      this.form.lastName = this.data.user.lastName;
    }
  }

  valid(): boolean {
    if (this.data.user) {
      return !!this.form.email && !!this.form.firstName && !!this.form.lastName;
    }
    return !!this.form.email && !!this.form.password && !!this.form.firstName && !!this.form.lastName;
  }

  save(): void {
    if (!this.valid()) return;
    this.saving.set(true);
    this.error.set('');

    const obs = this.data.user
      ? this.admin.updateUser(this.data.user.id, {
          email: this.form.email,
          firstName: this.form.firstName,
          lastName: this.form.lastName,
          roleIds: this.form.roleIds.length ? this.form.roleIds : undefined,
        })
      : this.admin.createUser({
          email: this.form.email,
          password: this.form.password,
          firstName: this.form.firstName,
          lastName: this.form.lastName,
          roleIds: this.form.roleIds.length ? this.form.roleIds : undefined,
        });

    obs.subscribe({
      next: () => {
        this.snackBar.open(`User ${this.data.user ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'An error occurred');
        this.saving.set(false);
      },
    });
  }
}

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminService } from './admin.service';
import { Role, Permission } from '../../shared/models/api-response';

interface DialogData {
  role?: Role;
}

@Component({
  selector: 'app-role-form-dialog',
  standalone: true,
  imports: [
    FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule,
    MatInputModule, MatCheckboxModule, MatExpansionModule,
    MatProgressSpinnerModule, MatSnackBarModule, TitleCasePipe,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.role ? 'Edit Role' : 'Add Role' }}</h2>

    <mat-dialog-content>
      <div class="form-fields">
        <mat-form-field appearance="outline">
          <mat-label>Role Name</mat-label>
          <input matInput [(ngModel)]="form.name" required [disabled]="data.role?.isSystem ?? false">
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Description</mat-label>
          <input matInput [(ngModel)]="form.description" [disabled]="data.role?.isSystem ?? false">
        </mat-form-field>
      </div>

      <h3 class="perm-heading">Permissions</h3>

      @if (loadingPerms()) {
        <div class="loading"><mat-spinner diameter="24"/></div>
      }

      @for (group of permissionGroups(); track group.resource) {
        <mat-expansion-panel>
          <mat-expansion-panel-header>
            <mat-panel-title>{{ group.resource | titlecase }}</mat-panel-title>
            <mat-panel-description>{{ selectedCountByResource(group.resource) }}/{{ group.permissions.length }} selected</mat-panel-description>
          </mat-expansion-panel-header>

          <div class="perm-group">
            @for (perm of group.permissions; track perm.id) {
              <mat-checkbox
                [checked]="selectedPermissionIds().includes(perm.id)"
                (change)="togglePermission(perm.id)">
                {{ perm.action | titlecase }}
              </mat-checkbox>
            }
          </div>
        </mat-expansion-panel>
      }

      @if (error()) {
        <div class="error-msg">{{ error() }}</div>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close [disabled]="saving()">Cancel</button>
      <button mat-flat-button color="primary" (click)="save()" [disabled]="saving() || !form.name">
        @if (saving()) {
          <mat-spinner diameter="20"/>
        }
        {{ data.role ? 'Update' : 'Create' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .form-fields { display: flex; flex-direction: column; gap: 16px; padding-top: 8px; }
    .perm-heading { margin: 16px 0 8px; font-size: 16px; font-weight: 500; }
    .loading { display: flex; justify-content: center; padding: 16px; }
    .perm-group { display: flex; flex-direction: column; gap: 8px; }
    .error-msg { color: #f44336; font-size: 14px; margin-top: 8px; }
    mat-spinner { display: inline-block; }
    mat-expansion-panel { margin-bottom: 4px; }
  `],
})
export class RoleFormDialog implements OnInit {
  private admin = inject(AdminService);
  private dialogRef = inject(MatDialogRef<RoleFormDialog>);
  private snackBar = inject(MatSnackBar);
  data: DialogData = inject(MAT_DIALOG_DATA);

  saving = signal(false);
  loadingPerms = signal(false);
  error = signal('');

  allPermissions = signal<Permission[]>([]);
  selectedPermissionIds = signal<string[]>([]);

  form = { name: '', description: '' };

  permissionGroups = computed(() => {
    const groups = new Map<string, Permission[]>();
    for (const p of this.allPermissions()) {
      if (!groups.has(p.resource)) groups.set(p.resource, []);
      groups.get(p.resource)!.push(p);
    }
    return Array.from(groups.entries()).map(([resource, perms]) => ({ resource, permissions: perms }));
  });

  ngOnInit(): void {
    if (this.data.role) {
      this.form.name = this.data.role.name;
      this.form.description = this.data.role.description;
    }

    this.loadingPerms.set(true);
    this.admin.getPermissions().subscribe({
      next: (perms) => {
        this.allPermissions.set(perms);
        if (this.data.role) {
          const permSet = new Set(this.data.role.permissions);
          const selected = perms.filter((p) => permSet.has(`${p.resource}:${p.action}`));
          this.selectedPermissionIds.set(selected.map((p) => p.id));
        }
        this.loadingPerms.set(false);
      },
      error: () => {
        this.error.set('Failed to load permissions');
        this.loadingPerms.set(false);
      },
    });
  }

  selectedCountByResource(resource: string): number {
    const resourcePerms = this.allPermissions().filter((p) => p.resource === resource);
    return resourcePerms.filter((p) => this.selectedPermissionIds().includes(p.id)).length;
  }

  togglePermission(id: string): void {
    this.selectedPermissionIds.update((ids) =>
      ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id],
    );
  }

  save(): void {
    if (!this.form.name) return;
    this.saving.set(true);
    this.error.set('');

    const roleObs = this.data.role
      ? this.admin.updateRole(this.data.role.id, this.form)
      : this.admin.createRole(this.form);

    roleObs.subscribe({
      next: (role) => {
        this.admin.assignRolePermissions(role.id, this.selectedPermissionIds()).subscribe({
          next: () => {
            this.snackBar.open(`Role ${this.data.role ? 'updated' : 'created'}`, 'Close', { duration: 3000 });
            this.dialogRef.close(true);
          },
          error: () => {
            this.error.set('Failed to assign permissions');
            this.saving.set(false);
          },
        });
      },
      error: (err) => {
        this.error.set(err.error?.message || 'An error occurred');
        this.saving.set(false);
      },
    });
  }
}

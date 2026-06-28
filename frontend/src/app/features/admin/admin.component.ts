import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from './admin.service';
import { User, Role } from '../../shared/models/api-response';
import { UserFormDialog } from './user-form.dialog';
import { RoleFormDialog } from './role-form.dialog';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    DatePipe, FormsModule,
    MatTabsModule, MatTableModule, MatSortModule, MatPaginatorModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatChipsModule, MatTooltipModule, MatDialogModule,
    MatSnackBarModule, MatProgressSpinnerModule,
  ],
  template: `
    <div class="page-header">
      <h1>Administration</h1>
    </div>

    <mat-tab-group (selectedTabChange)="onTabChange($event)">
      <mat-tab label="Users">
        <div class="tab-toolbar">
          <mat-form-field appearance="outline" subscriptSizing="dynamic">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="userSearch" (input)="applyUserFilter()" placeholder="Search by name or email">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
          <button mat-flat-button color="primary" (click)="openUserDialog()">
            <mat-icon>add</mat-icon> Add User
          </button>
        </div>

        <div class="table-container">
          @if (loadingUsers()) {
            <div class="loading-shade"><mat-spinner diameter="40"/></div>
          }
          <table mat-table [dataSource]="userDataSource" matSort>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
              <td mat-cell *matCellDef="let u">{{ u.email }}</td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let u">{{ u.firstName }} {{ u.lastName }}</td>
            </ng-container>
            <ng-container matColumnDef="roles">
              <th mat-header-cell *matHeaderCellDef>Roles</th>
              <td mat-cell *matCellDef="let u">
                <mat-chip-set>
                  @for (r of u.roles; track r) {
                    <mat-chip>{{ r }}</mat-chip>
                  }
                </mat-chip-set>
              </td>
            </ng-container>
            <ng-container matColumnDef="isActive">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Active</th>
              <td mat-cell *matCellDef="let u" style="text-align:center">
                <button mat-icon-button (click)="toggleActive(u)" [matTooltip]="u.isActive ? 'Deactivate' : 'Activate'">
                  <mat-icon [style.color]="u.isActive ? '#4caf50' : '#f44336'">
                    {{ u.isActive ? 'check_circle' : 'cancel' }}
                  </mat-icon>
                </button>
              </td>
            </ng-container>
            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Created</th>
              <td mat-cell *matCellDef="let u">{{ u.createdAt | date:'short' }}</td>
            </ng-container>
            <ng-container matColumnDef="actionEdit">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                <button mat-icon-button (click)="openUserDialog(u)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>
            <ng-container matColumnDef="actionDelete">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let u">
                <button mat-icon-button (click)="deleteUser(u)" [disabled]="u.email === 'admin@wms.com'" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="userColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: userColumns;"></tr>
          </table>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons/>
        </div>
      </mat-tab>

      <mat-tab label="Roles">
        <div class="tab-toolbar">
          <span></span>
          <button mat-flat-button color="primary" (click)="openRoleDialog()">
            <mat-icon>add</mat-icon> Add Role
          </button>
        </div>

        <div class="table-container">
          @if (loadingRoles()) {
            <div class="loading-shade"><mat-spinner diameter="40"/></div>
          }
          <table mat-table [dataSource]="roleDataSource" matSort>
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let r">{{ r.name }}</td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let r">{{ r.description }}</td>
            </ng-container>
            <ng-container matColumnDef="permissions">
              <th mat-header-cell *matHeaderCellDef>Permissions</th>
              <td mat-cell *matCellDef="let r">{{ r.permissions.length }} assigned</td>
            </ng-container>
            <ng-container matColumnDef="isSystem">
              <th mat-header-cell *matHeaderCellDef>System</th>
              <td mat-cell *matCellDef="let r">
                <mat-icon [style.color]="r.isSystem ? '#f44336' : '#4caf50'">
                  {{ r.isSystem ? 'lock' : 'public' }}
                </mat-icon>
              </td>
            </ng-container>
            <ng-container matColumnDef="actionEdit">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-icon-button (click)="openRoleDialog(r)" matTooltip="Edit">
                  <mat-icon>edit</mat-icon>
                </button>
              </td>
            </ng-container>
            <ng-container matColumnDef="actionDelete">
              <th mat-header-cell *matHeaderCellDef></th>
              <td mat-cell *matCellDef="let r">
                <button mat-icon-button (click)="deleteRole(r)" [disabled]="r.isSystem" matTooltip="Delete">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="roleColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: roleColumns;"></tr>
          </table>
          <mat-paginator [pageSizeOptions]="[10, 25, 50]" showFirstLastButtons/>
        </div>
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .page-header h1 { margin: 0 0 16px; font-size: 28px; font-weight: 500; }
    .tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin: 16px 0; }
    .tab-toolbar mat-form-field { width: 320px; }
    .table-container { position: relative; }
    .loading-shade { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); z-index: 1; }
    table { width: 100%; }
    .mat-column-actionEdit { width: 48px; text-align: center; }
    .mat-column-actionDelete { width: 48px; text-align: center; }
    .mat-column-isActive { width: 80px; text-align: center; }
    .mat-column-isSystem { width: 80px; text-align: center; }
    .mat-column-permissions { width: 140px; }
  `],
})
export class AdminComponent implements OnInit {
  private admin = inject(AdminService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  loadingUsers = signal(false);
  loadingRoles = signal(false);

  users = signal<User[]>([]);
  roles = signal<Role[]>([]);

  userSearch = '';
  userColumns = ['email', 'name', 'roles', 'isActive', 'createdAt', 'actionEdit', 'actionDelete'];
  roleColumns = ['name', 'description', 'permissions', 'isSystem', 'actionEdit', 'actionDelete'];

  userDataSource = new MatTableDataSource<User>([]);
  roleDataSource = new MatTableDataSource<Role>([]);

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.loadingUsers.set(true);
    this.admin.getUsers().subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.userDataSource.data = res.data;
        this.userDataSource.sort = this.sort;
        this.userDataSource.paginator = this.paginator;
        this.loadingUsers.set(false);
      },
      error: () => this.loadingUsers.set(false),
    });
  }

  loadRoles(): void {
    this.loadingRoles.set(true);
    this.admin.getRoles().subscribe({
      next: (res) => {
        this.roles.set(res.data);
        this.roleDataSource.data = res.data;
        this.loadingRoles.set(false);
      },
      error: () => this.loadingRoles.set(false),
    });
  }

  applyUserFilter(): void {
    this.userDataSource.filter = this.userSearch.trim().toLowerCase();
  }

  onTabChange(event: any): void {
    if (event.index === 0) {
      this.userDataSource.sort = this.sort;
      this.userDataSource.paginator = this.paginator;
    }
  }

  openUserDialog(user?: User): void {
    const ref = this.dialog.open(UserFormDialog, {
      width: '500px',
      data: { user, roles: this.roles() },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadUsers();
    });
  }

  toggleActive(user: User): void {
    this.admin.toggleActive(user.id).subscribe({
      next: () => {
        this.snackBar.open(`User ${user.isActive ? 'deactivated' : 'activated'}`, 'Close', { duration: 3000 });
        this.loadUsers();
      },
      error: () => this.snackBar.open('Failed to update user status', 'Close', { duration: 3000 }),
    });
  }

  deleteUser(user: User): void {
    if (confirm(`Delete user ${user.email}?`)) {
      this.admin.deleteUser(user.id).subscribe({
        next: () => {
          this.snackBar.open('User deleted', 'Close', { duration: 3000 });
          this.loadUsers();
        },
        error: () => this.snackBar.open('Failed to delete user', 'Close', { duration: 3000 }),
      });
    }
  }

  openRoleDialog(role?: Role): void {
    const ref = this.dialog.open(RoleFormDialog, {
      width: '600px',
      data: { role },
    });
    ref.afterClosed().subscribe((result) => {
      if (result) this.loadRoles();
    });
  }

  deleteRole(role: Role): void {
    if (confirm(`Delete role ${role.name}?`)) {
      this.admin.deleteRole(role.id).subscribe({
        next: () => {
          this.snackBar.open('Role deleted', 'Close', { duration: 3000 });
          this.loadRoles();
        },
        error: () => this.snackBar.open('Failed to delete role', 'Close', { duration: 3000 }),
      });
    }
  }
}

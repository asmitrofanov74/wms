import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User, Role, Permission, PaginatedResponse, CreateUserRequest, UpdateUserRequest, CreateRoleRequest, UpdateRoleRequest } from '../../shared/models/api-response';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);

  getUsers(): Observable<PaginatedResponse<User>> {
    return this.http.get<PaginatedResponse<User>>('/api/v1/users');
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/v1/users/${id}`);
  }

  createUser(dto: CreateUserRequest): Observable<User> {
    return this.http.post<User>('/api/v1/users', dto);
  }

  updateUser(id: string, dto: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`/api/v1/users/${id}`, dto);
  }

  toggleActive(id: string): Observable<User> {
    return this.http.patch<User>(`/api/v1/users/${id}/activate`, {});
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/users/${id}`);
  }

  getRoles(): Observable<PaginatedResponse<Role>> {
    return this.http.get<PaginatedResponse<Role>>('/api/v1/roles');
  }

  getRole(id: string): Observable<Role> {
    return this.http.get<Role>(`/api/v1/roles/${id}`);
  }

  createRole(dto: CreateRoleRequest): Observable<Role> {
    return this.http.post<Role>('/api/v1/roles', dto);
  }

  updateRole(id: string, dto: UpdateRoleRequest): Observable<Role> {
    return this.http.put<Role>(`/api/v1/roles/${id}`, dto);
  }

  deleteRole(id: string): Observable<void> {
    return this.http.delete<void>(`/api/v1/roles/${id}`);
  }

  getRolePermissions(id: string): Observable<string[]> {
    return this.http.get<string[]>(`/api/v1/roles/${id}/permissions`);
  }

  assignRolePermissions(id: string, permissionIds: string[]): Observable<void> {
    return this.http.put<void>(`/api/v1/roles/${id}/permissions`, { permissionIds });
  }

  getPermissions(): Observable<Permission[]> {
    return this.http.get<Permission[]>('/api/v1/roles/permissions');
  }
}

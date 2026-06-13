import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockContext = (user: any) => ({
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: () => 'handler',
    getClass: () => 'class',
  }) as any;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const result = guard.canActivate(mockContext({ roles: ['Admin'] }));
    expect(result).toBe(true);
  });

  it('should allow access when user has required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin']);
    const result = guard.canActivate(mockContext({ roles: ['Admin'] }));
    expect(result).toBe(true);
  });

  it('should allow access when user has one of the required roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin', 'Manager']);
    const result = guard.canActivate(mockContext({ roles: ['Manager'] }));
    expect(result).toBe(true);
  });

  it('should deny access when user does not have required role', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin']);
    const result = guard.canActivate(mockContext({ roles: ['Operator'] }));
    expect(result).toBe(false);
  });

  it('should deny access when user has no roles', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin']);
    const result = guard.canActivate(mockContext({ roles: [] }));
    expect(result).toBe(false);
  });

  it('should throw when user is undefined and roles are required', () => {
    reflector.getAllAndOverride.mockReturnValue(['Admin']);
    expect(() => guard.canActivate(mockContext(undefined))).toThrow();
  });
});

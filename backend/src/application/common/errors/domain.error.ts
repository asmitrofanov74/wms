export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(entity: string, id: string) {
    super(`${entity} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class ConcurrencyError extends DomainError {
  constructor() {
    super('Resource was modified by another transaction. Please retry.');
    this.name = 'ConcurrencyError';
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'BusinessRuleError';
  }
}

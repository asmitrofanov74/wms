export interface ICommand {
  readonly correlationId?: string;
}

export interface IQuery {
  readonly correlationId?: string;
}

export interface IEventHandler<T> {
  handle(event: T): Promise<void>;
}

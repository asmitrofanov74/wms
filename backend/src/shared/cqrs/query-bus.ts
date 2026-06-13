export abstract class Query {}

export abstract class QueryHandler<TQuery extends Query, TResult> {
  abstract execute(query: TQuery): Promise<TResult>;
}

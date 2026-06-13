export class PaginationDto {
  page: number = 1;
  limit: number = 20;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export class PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

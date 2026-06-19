import { Repository, FindOptionsWhere, FindManyOptions, ObjectLiteral } from 'typeorm';
import { PaginatedResult } from './pagination.dto';

export { PaginatedResult };

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'ASC' | 'DESC';
}

export async function paginate<T extends ObjectLiteral>(
  repository: Repository<T>,
  query: PaginationQuery,
  options?: {
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[];
    relations?: string[];
    search?: { fields: string[]; term: string };
    order?: { [P in keyof T]?: 'ASC' | 'DESC' };
  },
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, query.page || 1);
  const limit = Math.min(100, Math.max(1, query.limit || 20));
  const skip = (page - 1) * limit;

  const findOptions: FindManyOptions<T> = {
    where: options?.where,
    relations: options?.relations,
    skip,
    take: limit,
    order: (options?.order as any) || { createdAt: 'DESC' } as any,
  };

  const [data, total] = await repository.findAndCount(findOptions);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
}

import { z } from 'zod';

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(15),
});

export type Pagination = z.infer<typeof paginationQuery>;

export function toSkipTake({ page, perPage }: Pagination) {
  return { skip: (page - 1) * perPage, take: perPage };
}

export function paginated<T>(data: T[], total: number, { page, perPage }: Pagination) {
  return { data, meta: { page, perPage, total } };
}

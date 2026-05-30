/** 统一分页结果类型，对应后端 types.PageResponse */
export interface PageResult<T> {
  total: number;
  records: T[];
}
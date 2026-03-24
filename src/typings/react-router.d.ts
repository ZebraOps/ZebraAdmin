// Module augmentation for react-router – must be a module file (has export {})
// to properly augment the existing module rather than replace it.
export {};

declare module 'react-router' {
  interface IndexRouteObject {
    meta?: RouteMeta;
  }
  interface NonIndexRouteObject {
    meta?: RouteMeta;
  }
}

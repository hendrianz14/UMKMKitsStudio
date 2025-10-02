import type { Route } from "next";

export function href<P extends string>(pathname: P, locale: string) {
  return { pathname: path(pathname, locale) } as const;
}

export function path(pathname: string, locale: string): Route {
  return (`/${locale}${pathname.replace("/[locale]", "")}` as unknown) as Route;
}

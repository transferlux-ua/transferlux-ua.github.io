import routes from "./data/routes.json";
import { CITY_BY_ID } from "../shared/cities";

export interface SeoRoute { from: string; to: string; km: number; minutes: number; via: string | null }
export const SEO_ROUTES: SeoRoute[] = (routes as SeoRoute[]).filter((r) => CITY_BY_ID[r.from] && CITY_BY_ID[r.to] && r.km > 0);
export const slug = (r: { from: string; to: string }) => `${r.from}-${r.to}`;
export const findRoute = (s: string) => SEO_ROUTES.find((r) => slug(r) === s) || null;
export const HOME_ROUTES = SEO_ROUTES.slice(0, 10);

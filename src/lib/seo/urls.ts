export const SEO_SITE = "https://oqlio.com";

export function bestServiceInCityUrl(serviceSlug: string, citySlug: string) {
  return `/best-${serviceSlug}-in-${citySlug}`;
}
export function serviceForIndustryUrl(serviceSlug: string, industrySlug: string) {
  return `/${serviceSlug}-for-${industrySlug}`;
}
export function bestServiceForIndustryInCityUrl(
  serviceSlug: string,
  industrySlug: string,
  citySlug: string,
) {
  return `/best-${serviceSlug}-for-${industrySlug}-in-${citySlug}`;
}

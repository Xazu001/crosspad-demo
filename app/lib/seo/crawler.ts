/**
 * Crawler detection utilities for SEO
 */
import { isbot } from "isbot";

/**
 * Checks if request is from a crawler/bot
 * @param request - Request object
 * @returns True if the request is from a crawler
 */
export function isCrawler(request: Request): boolean {
  const userAgent = request.headers.get("User-Agent");
  if (!userAgent) return false;
  return isbot(userAgent);
}

/**
 * Checks if a User-Agent string belongs to a crawler
 * @param userAgent - User-Agent string
 * @returns True if the User-Agent is from a crawler
 */
export function isCrawlerUserAgent(userAgent: string): boolean {
  return isbot(userAgent);
}

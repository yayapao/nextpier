/**
 * User configuration types
 *
 * These types define the shape of user preferences stored in the server-side
 * config.json file and accessed via API routes.
 */

/**
 * Global user configuration
 */
export interface UserConfig {
  /** UI theme preference */
  theme: 'light' | 'dark' | 'system';
}

/**
 * Partial config for updates - all fields optional
 */
export type PartialUserConfig = Partial<UserConfig>;

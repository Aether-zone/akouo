export const LOCULUS_CONFIG = 'LOCULUS_CONFIG';

/**
 * What `StoredFile.bucket` carries for every file akouo stores.
 *
 * The column names the backend rather than a bucket. There is only one backend
 * now, but the value is still written: it is what a row from before the move
 * would not have, and what any future second store would be told apart by.
 */
export const LOCULUS_BACKEND = 'loculus';

/** Where loculus is, and how patient akouo is with it. */
export interface LoculusConfig {
  /**
   * Origin of the loculus api, without a trailing slash.
   *
   * Reached server-to-server, so this is an *internal* address — unlike the
   * store endpoint loculus signs into its URLs, which has to be one the
   * browser can resolve.
   */
  baseUrl: string;
  /**
   * How long to wait for loculus before giving up, in milliseconds.
   *
   * Signing is arithmetic and a `HeadObject` is one round trip, so a slow
   * answer means loculus or its store is unwell — and a request that hangs
   * holds an akouo connection open for a browser that has already stopped
   * waiting.
   */
  timeoutMs: number;
  /**
   * akouo's own credentials at pistis, for work no caller is waiting on.
   *
   * Optional: a deployment that never transcribes needs no identity of its own,
   * because every other path has a caller to borrow a token from. Absent,
   * background work fails with a message saying so, rather than the api
   * refusing to boot over a credential most of it does not use.
   */
  serviceCredentials?: {
    /** pistis's token endpoint. */
    tokenUri: string;
    clientId: string;
    clientSecret: string;
  };
}

export const defaultLoculusConfig: LoculusConfig = {
  baseUrl: 'http://localhost:3111',
  timeoutMs: 5_000,
};

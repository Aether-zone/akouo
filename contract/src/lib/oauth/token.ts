import { z } from 'zod';

/**
 * A successful response from pistis's token endpoint (RFC 6749 §5.1).
 *
 * `refresh_token` is only present for the authorization code and refresh token
 * grants — the client credentials grant has nothing to refresh, since the client
 * can simply ask again.
 */
export const tokenResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

/** The flat error body the spec requires (RFC 6749 §5.2), not Nest's envelope. */
export const oauthErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});

export type TokenResponseDTO = z.infer<typeof tokenResponseSchema>;
export type OAuthErrorDTO = z.infer<typeof oauthErrorSchema>;

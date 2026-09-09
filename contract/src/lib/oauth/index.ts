/*
 * The access token's own claim vocabulary — roles, the `orgs` membership map,
 * the RFC 9068 claim set and the userinfo body — lives in
 * `@aether-zone/organon`, which is what akouo verifies tokens with. Restating
 * it here is how the two ends drift.
 *
 * What stays is the token *endpoint's* response shape, which organon has no
 * opinion about: it is a resource server and never calls that endpoint.
 */
export * from './token';

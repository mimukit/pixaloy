/** Where the local fixture server listens. Shared by the server, the config and the tests. */
export const FIXTURE_HOST = '127.0.0.1';
export const FIXTURE_PORT = 4178;
export const FIXTURE_ORIGIN = `http://${FIXTURE_HOST}:${FIXTURE_PORT}`;

export function fixtureUrl(name: string): string {
  return `${FIXTURE_ORIGIN}/${name}`;
}

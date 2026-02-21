import { CommandRegistry } from '../components/Citadel/types/command-registry';
import { command, createCommandRegistry, json, text } from '../components/Citadel/types/command-dsl';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

const getApiBaseUrl = (): string =>
  (localStorage.getItem('dev.api.baseUrl') || DEFAULT_API_BASE_URL).trim();

export function createLocalDevCommandRegistry(): CommandRegistry {
  return createCommandRegistry([
    command('stack.status')
      .describe('Show local full-stack service status')
      .handle(async () =>
        json({
          frontend: { url: 'http://localhost:5173', status: 'running' },
          backend: { url: getApiBaseUrl(), status: 'running' },
          database: { engine: 'postgres', status: 'connected' },
          worker: { queue: 'jobs', status: 'idle' },
          timestamp: new Date().toISOString(),
        })
      ),

    command('api.base.set')
      .describe('Set local API base URL')
      .arg('url', (arg) => arg.describe('Example: http://localhost:3000'))
      .handle(async ({ namedArgs }) => {
        const url = (namedArgs.url || '').trim();
        if (!url) {
          throw new Error('Please provide a URL, for example "http://localhost:3000".');
        }

        localStorage.setItem('dev.api.baseUrl', url);
        return text(`Local API base URL set to ${url}`);
      }),

    command('api.base.show')
      .describe('Show local API base URL')
      .handle(async () => text(`Local API base URL: ${getApiBaseUrl()}`)),

    command('api.get')
      .describe('GET a local API route')
      .arg('route', (arg) => arg.describe('Route path, for example /api/health'))
      .handle(async ({ namedArgs }) => {
        const rawRoute = (namedArgs.route || '').trim();
        const route = rawRoute.startsWith('/') ? rawRoute : `/${rawRoute}`;
        const url = `${getApiBaseUrl()}${route}`;

        try {
          const response = await fetch(url);
          const contentType = response.headers.get('content-type') || '';
          const body = contentType.includes('application/json')
            ? await response.json()
            : await response.text();

          return json({
            ok: response.ok,
            status: response.status,
            method: 'GET',
            url,
            body,
          });
        } catch (error) {
          return json({
            ok: false,
            method: 'GET',
            url,
            error: error instanceof Error ? error.message : String(error),
            hint: 'Make sure your local backend is running and CORS allows this origin.',
          });
        }
      }),

    command('db.query')
      .describe('Run a quick local DB query (simulated)')
      .arg('sql', (arg) => arg.describe('SQL statement wrapped in quotes'))
      .handle(async ({ namedArgs }) => {
        const sql = (namedArgs.sql || '').trim();
        if (!sql) {
          throw new Error('Please pass a SQL statement.');
        }

        return json({
          query: sql,
          elapsedMs: 18,
          rows: [
            { id: 101, email: 'dev1@example.local', role: 'admin' },
            { id: 102, email: 'dev2@example.local', role: 'editor' },
          ],
        });
      }),

    command('seed.users')
      .describe('Seed local development users')
      .arg('count', (arg) => arg.describe('How many users to seed (default: 10)'))
      .handle(async ({ namedArgs }) => {
        const count = Math.max(1, parseInt(namedArgs.count || '10', 10));
        return text(`Seeded ${count} local users into the development database.`);
      }),

    command('logs.fullstack.tail')
      .describe('Tail recent full-stack logs')
      .handle(async () => {
        const lines = [
          '[frontend] GET /dashboard 200 31ms',
          '[api] GET /api/health 200 6ms',
          '[db] SELECT * FROM users WHERE active=true 12ms',
          '[worker] processed queue=emails job_id=job_892',
          '[api] POST /api/todos 201 14ms',
        ];
        return text(lines.join('\n'));
      }),

    command('localstorage.key.get')
      .describe('Read a single localStorage key')
      .arg('key', (arg) => arg.describe('Storage key name'))
      .handle(async ({ namedArgs }) => {
        const key = (namedArgs.key || '').trim();
        if (!key) {
          throw new Error('Please provide a key name.');
        }

        const value = localStorage.getItem(key);
        return json({
          key,
          exists: value !== null,
          value,
        });
      }),

    command('localstorage.key.set')
      .describe('Set a single localStorage key')
      .arg('key', (arg) => arg.describe('Storage key name'))
      .arg('value', (arg) => arg.describe('Value to store'))
      .handle(async ({ namedArgs }) => {
        const key = (namedArgs.key || '').trim();
        if (!key) {
          throw new Error('Please provide a key name.');
        }

        const value = namedArgs.value ?? '';
        localStorage.setItem(key, value);
        return text(`Set localStorage key "${key}".`);
      }),

    command('localstorage.key.remove')
      .describe('Remove a single localStorage key')
      .arg('key', (arg) => arg.describe('Storage key name'))
      .handle(async ({ namedArgs }) => {
        const key = (namedArgs.key || '').trim();
        if (!key) {
          throw new Error('Please provide a key name.');
        }

        const existed = localStorage.getItem(key) !== null;
        localStorage.removeItem(key);
        return text(
          existed
            ? `Removed localStorage key "${key}".`
            : `Key "${key}" was not set.`
        );
      }),
  ]);
}

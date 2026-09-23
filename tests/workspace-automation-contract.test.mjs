import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const root = path.resolve(import.meta.dirname, '..');
const read = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');

test('Docker validates the root lockfile without installing the Expo workspace', () => {
  const dockerfile = read('Dockerfile');
  assert.match(dockerfile, /COPY package\.json package-lock\.json/);
  assert.match(dockerfile, /COPY mobile\/package\.json mobile\/package\.json/);
  assert.match(dockerfile, /npm ci --workspaces=false/);
  assert.doesNotMatch(dockerfile, /COPY --from=build[^\n]*\/app\/mobile(?:\/|\s|$)/);
});

test('the IPA workflow installs once at the root and selects the Expo workspace', () => {
  const workflow = read('.github/workflows/ios-unsigned.yml');
  assert.match(workflow, /cache-dependency-path: package-lock\.json/);
  assert.match(workflow, /npm ci --no-audit --no-fund/);
  assert.match(workflow, /npm --workspace misaluteca-ios run lint/);
  assert.match(workflow, /npm --workspace misaluteca-ios exec -- expo-doctor/);
  assert.match(workflow, /npm --workspace misaluteca-ios exec -- expo prebuild --platform ios --no-install/);
  assert.doesNotMatch(workflow, /working-directory: mobile/);
  assert.doesNotMatch(workflow, /mobile\/package-lock\.json/);
});

test('the backend workflow keeps its root-only Next installation and never invokes Expo', () => {
  const workflow = read('.github/workflows/backend-easypanel.yml');
  assert.match(workflow, /npm ci --workspaces=false --no-audit --no-fund/);
  assert.doesNotMatch(workflow, /npm[^\n]*exec[^\n]*expo|npm[^\n]*--workspace misaluteca-ios/);
});

test('backend verifies that the built image contains no mobile runtime before deploying', () => {
  const workflow = read('.github/workflows/backend-easypanel.yml');
  assert.match(workflow, /docker run --rm --entrypoint node misaluteca-backend:checked/);
  assert.match(workflow, /require\.resolve\(dependency\)/);
  assert.match(workflow, /\['expo', 'react-native'\]/);
  assert.match(workflow, /existsSync\('\/app\/mobile'\)/);
  assert.ok(workflow.indexOf('Verificar aislamiento de imagen web') < workflow.indexOf('Solicitar deploy'));
});

test('backend starts the image on loopback, verifies a DB-independent asset and cleans up on failure', () => {
  const workflow = read('.github/workflows/backend-easypanel.yml');
  const start = workflow.indexOf('- name: Comprobar arranque Next de imagen final');
  const deploy = workflow.indexOf('- name: Solicitar deploy');
  assert.ok(start >= 0 && start < deploy);
  const smoke = workflow.slice(start, deploy);
  assert.match(smoke, /trap .*docker rm -f .* EXIT/);
  assert.match(smoke, /docker run -d --name .* -p 127\.0\.0\.1::3000 misaluteca-backend:checked/);
  assert.match(smoke, /docker port .* 3000\/tcp/);
  assert.match(smoke, /curl --fail --silent --show-error --max-time 2/);
  assert.match(smoke, /\/maintenance\.html/);
  assert.match(smoke, /cmp .* public\/maintenance\.html/);
  assert.doesNotMatch(smoke, /--env|--env-file|secrets\./);
});

test('image isolation rejects a resolvable Expo runtime and accepts absent packages', () => {
  const workflow = read('.github/workflows/backend-easypanel.yml');
  const script = workflow.match(/docker run --rm --entrypoint node misaluteca-backend:checked -e "([\s\S]*?)"/)[1];
  const requireAbsent = () => ({ existsSync: () => false });
  requireAbsent.resolve = () => { throw Object.assign(new Error('absent'), { code: 'MODULE_NOT_FOUND' }); };
  assert.doesNotThrow(() => runInNewContext(script, { require: requireAbsent, console: { log() {} } }));
  const requirePresent = () => ({ existsSync: () => false });
  requirePresent.resolve = () => '/app/node_modules/expo/index.js';
  assert.throws(() => runInNewContext(script, { require: requirePresent, console: { log() {} } }), /runtime móvil: expo/);
});

test('image isolation rejects mobile resources and propagates unexpected resolution failures', () => {
  const workflow = read('.github/workflows/backend-easypanel.yml');
  const script = workflow.match(/docker run --rm --entrypoint node misaluteca-backend:checked -e "([\s\S]*?)"/)[1];
  assert.throws(() => runInNewContext(script, { require: () => ({ existsSync: () => true }) }), /recursos móviles/);
  const requireBroken = () => ({ existsSync: () => false });
  requireBroken.resolve = () => { throw Object.assign(new Error('resolution failed'), { code: 'EACCES' }); };
  assert.throws(() => runInNewContext(script, { require: requireBroken }), /resolution failed/);
});

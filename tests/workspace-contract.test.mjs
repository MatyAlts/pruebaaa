import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '..');
const packageJson = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'));
const ipaGuide = readFileSync(path.join(root, 'docs', 'ios-primer-ipa.md'), 'utf8');

test('the root package declares the Expo application as its workspace', () => {
  assert.deepEqual(packageJson.workspaces, ['mobile']);
});

test('the repository versions one npm lockfile for both packages', () => {
  assert.equal(existsSync(path.join(root, 'package-lock.json')), true);
  assert.equal(existsSync(path.join(root, 'mobile', 'package-lock.json')), false);
});

test('root scripts select the mobile workspace while web commands remain at root', () => {
  assert.match(packageJson.scripts['mobile:lint'], /--workspace misaluteca-ios run lint/);
  assert.match(packageJson.scripts['mobile:typecheck'], /--workspace misaluteca-ios run typecheck/);
  assert.match(packageJson.scripts['mobile:install:check'], /exec -- expo install --check/);
  assert.equal(packageJson.scripts.build, 'next build');
});

test('the IPA guide gives current root-workspace installation commands', () => {
  assert.match(ipaGuide, /Desde la raíz:/);
  assert.match(ipaGuide, /npm ci --no-audit --no-fund/);
  assert.match(ipaGuide, /npm run mobile:doctor/);
  assert.doesNotMatch(ipaGuide, /Los paquetes y lockfile son propios de móvil; no hay workspaces\./);
});

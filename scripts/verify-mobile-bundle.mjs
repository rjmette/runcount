#!/usr/bin/env node

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const webBundle = join(projectRoot, 'build');
const iosBundle = join(projectRoot, 'ios', 'App', 'App', 'public');
const nativeOnlyFiles = new Set(['cordova.js', 'cordova_plugins.js']);

const collectFiles = (root, current = root) => {
  const entries = readdirSync(current, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(current, entry.name);
    if (entry.isDirectory()) return collectFiles(root, path);
    if (entry.isFile() && entry.name !== '.DS_Store') return [relative(root, path)];
    return [];
  });
};

const assertDirectory = (path, label) => {
  const stats = statSync(path, { throwIfNoEntry: false });
  if (!stats?.isDirectory()) {
    throw new Error(`${label} does not exist: ${path}`);
  }
};

assertDirectory(webBundle, 'Web build');
assertDirectory(iosBundle, 'iOS web bundle');

const webFiles = collectFiles(webBundle).sort();
const iosFiles = collectFiles(iosBundle).sort();
const webFileSet = new Set(webFiles);
const iosFileSet = new Set(iosFiles);
const missingFromIos = webFiles.filter((file) => !iosFileSet.has(file));
const extraInIos = iosFiles.filter(
  (file) => !webFileSet.has(file) && !nativeOnlyFiles.has(file),
);
const contentMismatches = webFiles.filter(
  (file) =>
    iosFileSet.has(file) &&
    !readFileSync(join(webBundle, file)).equals(readFileSync(join(iosBundle, file))),
);

if (missingFromIos.length || extraInIos.length || contentMismatches.length) {
  const details = [
    missingFromIos.length ? `missing from iOS: ${missingFromIos.join(', ')}` : '',
    extraInIos.length ? `extra in iOS: ${extraInIos.join(', ')}` : '',
    contentMismatches.length ? `content differs: ${contentMismatches.join(', ')}` : '',
  ].filter(Boolean);
  throw new Error(`iOS web bundle is not an exact copy of build/: ${details.join('; ')}`);
}

console.log(
  `Verified ${webFiles.length} web assets are mirrored exactly in ios/App/App/public.`,
);

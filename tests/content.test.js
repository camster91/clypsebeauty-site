import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { applyContentFixes } from '../src/content-fixes.mjs';

const root = path.resolve('html');

test('no placeholder copy is rendered on any page', () => {
  for (const file of fs.readdirSync(root).filter((f) => f.endsWith('.html'))) {
    const out = applyContentFixes(file, fs.readFileSync(path.join(root, file), 'utf8'));
    for (const re of [/lorem ipsum/i, /A frequently asked question/, /A detailed answer to provide information/, /Use this section to/, /A description of the product\. Use this space/]) {
      assert.ok(!re.test(out), `${file} still contains ${re}`);
    }
  }
});

test('JSON-LD stays valid after the fixes', () => {
  for (const file of ['help-info.html', 'terms-privacy.html', 'product__the-eclypse-serum.html']) {
    const out = applyContentFixes(file, fs.readFileSync(path.join(root, file), 'utf8'));
    for (const m of out.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);
  }
});

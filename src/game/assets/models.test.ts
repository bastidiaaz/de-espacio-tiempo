/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { glbStats } from './glbStats';
import { MODELS, TRIANGLE_BUDGET } from './models';

const root = (p: string) => fileURLToPath(new URL(`../../../${p}`, import.meta.url));
const shipped = readdirSync(root('public/models')).filter((f) => f.endsWith('.glb'));
const credits = readFileSync(root('CREDITS.md'), 'utf8');
const entries = Object.entries(MODELS);

describe('public/models', () => {
  it('every .glb is listed in MODELS, and every entry has its file', () => {
    expect(shipped.sort()).toEqual(entries.map(([, m]) => m.file).sort());
  });

  it.each(entries)('%s stays inside its budget and the low-poly look', (_id, m) => {
    const s = glbStats(readFileSync(root(`public/models/${m.file}`)));
    expect(s.triangles, `${m.file}: ${s.triangles} triangles, budget ${TRIANGLE_BUDGET[m.kind]}`).toBeLessThanOrEqual(
      TRIANGLE_BUDGET[m.kind],
    );
    expect(s.vertexColors, `${m.file} has a primitive without COLOR_0`).toBe(true);
    expect(s.textures, `${m.file} carries textures`).toBe(0);
    expect(s.extensionsRequired, `${m.file} needs a decoder we don't ship`).toEqual([]);
  });

  it.each(entries)('%s is credited in CREDITS.md', (_id, m) => {
    expect(credits).toContain(m.source.replace(/^polyfork:/, ''));
  });
});

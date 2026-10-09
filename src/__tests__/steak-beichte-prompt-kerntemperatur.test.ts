import { describe, it, expect } from 'vitest';
import { SYSTEM_PROMPT } from '@/lib/steak-beichte/prompts';
import { garstufenRind, badge, spanne } from '@/lib/kerntemperatur-referenz';

describe('Steak-Beichte-Prompt zieht Kerntemperaturen aus der Referenz', () => {
  it('nennt jede Rind-Garstufe mit dem Korridor der Referenz', () => {
    for (const g of Object.values(garstufenRind())) {
      expect(SYSTEM_PROMPT).toContain(`${g.label.toLowerCase()} ${g.range[0]}–${g.range[1]} °C`);
    }
  });
  it('nennt den Medium-Rare-Standard aus badges.beef_mr', () => {
    expect(SYSTEM_PROMPT).toContain(`${badge('beef_mr').c} °C`);
  });
  it('enthält die alten festen Näherungswerte nicht mehr', () => {
    expect(SYSTEM_PROMPT).not.toMatch(/rare ~50 °C|medium ~57 °C|durch 63 °C\+/);
  });
});

describe('Schweinenacken im Prompt', () => {
  it('nennt Nacken- und Pulled-Pork-Werte aus der Referenz', () => {
    expect(SYSTEM_PROMPT).toContain(`durch ${spanne('pork_nacken')}`);
    expect(SYSTEM_PROMPT).toContain(`leicht rosa ${badge('pork_nacken_rosa').c} °C`);
    expect(SYSTEM_PROMPT).toContain(`Pulled Pork: ${spanne('pork_lowslow')}`);
  });
});

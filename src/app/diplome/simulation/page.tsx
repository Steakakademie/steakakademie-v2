import { anzahlDiplomLektionen } from '@/lib/plattform-puls';
import SimulationClient from './SimulationClient';

/**
 * Server-Huelle der Diplom-Demo (03.10.2026). Die Demo ist ein Client-Bauteil und
 * kann den Lektionsbestand nicht selbst lesen — dort stand deshalb getippt
 * „4 Module" und „alle vier Lektionen", waehrend Stufe 1 elf Lektionen hat.
 * Die Zahl kommt jetzt aus dem Bestand und wird hineingereicht.
 */
export default function DiplomSimulationPage() {
  return <SimulationClient lektionenStufe1={anzahlDiplomLektionen(1)} />;
}

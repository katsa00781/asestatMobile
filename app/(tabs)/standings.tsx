/**
 * Tabella tab – két szegmens: a bajnoki tabella és az Igazolások (D-110).
 *
 * A route csak a szegmensválasztást birtokolja; a két nézetnek saját
 * görgetője van (a tabella ragadós oszlopfejléce és az igazolások ragadós
 * csapatfejléce nem fér meg egy közös görgetőben), ezért a szegmentált
 * kontroll elemként megy le a megjelenítő komponensbe.
 */
import { useState } from 'react';

import { MovementsPanel } from '@/components/MovementsPanel';
import { SegmentedControl } from '@/components/SegmentedControl';
import { StandingsPanel } from '@/components/StandingsPanel';

type StandingsTab = 'standings' | 'movements';

const SEGMENTS = [
  { key: 'standings', label: 'Tabella' },
  { key: 'movements', label: 'Igazolások' },
];

export default function StandingsScreen() {
  const [segment, setSegment] = useState<StandingsTab>('standings');

  const control = (
    <SegmentedControl
      options={SEGMENTS}
      activeKey={segment}
      onSelect={(key) => setSegment(key as StandingsTab)}
      accessibilityLabel="Nézet"
    />
  );

  return segment === 'standings' ? (
    <StandingsPanel control={control} />
  ) : (
    <MovementsPanel control={control} />
  );
}

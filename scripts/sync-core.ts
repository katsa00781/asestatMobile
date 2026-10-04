/**
 * @core szinkron – a webprojekt `lib/` mappájából másolja a tiszta elemző
 * modulokat a `core/` mappába, fejléc-kommenttel.
 *
 * Futtatás: `npm run sync:core`
 * A webprojekt helye: `ASESTATS_WEB_PATH` env változó, alapértelmezés `../asestats`.
 *
 * A `core/` mappát KÉZZEL SZERKESZTENI TILOS – ez a webprojekt lib/-jének tükre.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const MODULES = [
  'stat-formulas',
  'positions',
  'terminology',
  'style-vocabulary',
  'dashboard-types',
  'player-stat-mapping',
  'season-tables',
  'fetch-all-rows',
  'situational-analysis',
  'kosarstat-clutch-parse',
  'kosarstat-pbp-parse',
  'postgame-report',
  'player-analysis',
  'player-postgame',
  'pregame-scouting',
  'team-analysis',
  'player-movements',
] as const;

/** RN alatt nem futtatható importok – ezekre figyelmeztetünk, de nem patchelünk. */
const FORBIDDEN_IMPORT = /from\s+['"](react|react-dom|next\/|@supabase\/|node:|fs|path)/;

/**
 * Típushidak – a webprojekt generált `Database` típusára hivatkozó sorok
 * átírása a mobil kézi típustükrére.
 *
 * A webes kliens típusozott (`lib/supabase.ts` tartalmazza a séma típusait),
 * a mobil kliensé nem, és nem is lesz az: a mobil app csak olvas, és a
 * válaszokat rendszerhatáron validálja. Ez generálás, nem kézi patch – a
 * `core/` továbbra sem szerkeszthető kézzel (D-112).
 *
 * Ha egy minta nem illeszkedik, a szinkron figyelmeztet: a webes forrás
 * megváltozott, és a hidat frissíteni kell.
 */
const TYPE_BRIDGES: Record<string, { find: RegExp; replace: string }[]> = {
  'player-movements': [
    {
      find: /import type \{ Database \} from '@\/lib\/supabase';/,
      replace: "import type { PlayerMovementRow } from '@/types/movements';",
    },
    {
      find: /export type PlayerMovement = Database\['public'\]\['Views'\]\['league_player_movements'\]\['Row'\];/,
      replace: 'export type PlayerMovement = PlayerMovementRow;',
    },
  ],
};

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const webRoot = resolve(process.env.ASESTATS_WEB_PATH ?? join(projectRoot, '..', 'asestats'));
const sourceDir = join(webRoot, 'lib');
const targetDir = join(projectRoot, 'core');

if (!existsSync(sourceDir)) {
  console.error(`Nem találom a webprojekt lib/ mappáját: ${sourceDir}`);
  console.error('Állítsd be az ASESTATS_WEB_PATH környezeti változót.');
  process.exit(1);
}

mkdirSync(targetDir, { recursive: true });

let copied = 0;
const warnings: string[] = [];

for (const name of MODULES) {
  const from = join(sourceDir, `${name}.ts`);
  if (!existsSync(from)) {
    warnings.push(`hiányzik: lib/${name}.ts`);
    continue;
  }

  const raw = readFileSync(from, 'utf8');
  for (const line of raw.split('\n')) {
    if (FORBIDDEN_IMPORT.test(line)) {
      warnings.push(`${name}.ts külső importot tartalmaz: ${line.trim()}`);
    }
  }

  // A típushidak a `@/lib/x` átírás ELŐTT futnak, különben a `@/lib/supabase`
  // hivatkozásra „nem szinkronizált modult importál" figyelmeztetés jönne.
  let bridged = raw;
  for (const bridge of TYPE_BRIDGES[name] ?? []) {
    if (!bridge.find.test(bridged)) {
      warnings.push(`${name}.ts típushídja nem illeszkedik: ${bridge.find.source}`);
      continue;
    }
    bridged = bridged.replace(bridge.find, bridge.replace);
  }

  // A webprojekt a testvérmodulokat `@/lib/x` aliasszal hivatkozza. A mobil `@/`
  // a repo gyökerére mutat (és van saját `lib/` mappánk), ezért a szinkron
  // relatív importra írja át őket. Ez generálás, nem kézi patch – lásd D-009.
  const source = bridged.replace(/(['"])@\/lib\/([\w-]+)\1/g, (match: string, quote: string, module: string) => {
    if (!(MODULES as readonly string[]).includes(module)) {
      warnings.push(`${name}.ts nem szinkronizált modult importál: ${match}`);
      return match;
    }
    return `${quote}./${module}${quote}`;
  });

  const header =
    `// GENERÁLT MÁSOLAT – forrás: asestats/lib/${name}.ts\n` +
    `// Ne szerkeszd kézzel. Javítás a webprojektben, majd: npm run sync:core\n\n`;

  writeFileSync(join(targetDir, `${name}.ts`), header + source, 'utf8');
  copied += 1;
}

console.log(`@core szinkron kész: ${copied}/${MODULES.length} modul → core/`);
if (warnings.length > 0) {
  console.warn('\nFigyelmeztetések:');
  for (const warning of warnings) console.warn(`  - ${warning}`);
}

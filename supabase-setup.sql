-- =====================================================================
--  Retail F1 Fiber – Bestenlisten (Siege & HA-Only-Treffer)
--  Einmalig im Supabase-Dashboard ausführen: SQL Editor → New query →
--  diesen Inhalt einfügen → "Run". Die Flappy-Tabelle "scores" wird
--  NICHT angefasst.
-- =====================================================================

-- 1) Tabelle: eine Zeile pro Spielername (Groß/Kleinschreibung egal)
create table if not exists public.f1_stats (
  player_key  text primary key,                       -- lower(trim(name)), intern
  player_name text not null check (char_length(player_name) between 1 and 16),
  wins        integer not null default 0 check (wins >= 0),
  ha_hits     integer not null default 0 check (ha_hits >= 0),
  races       integer not null default 0 check (races >= 0),
  truck       text check (char_length(truck) <= 40),   -- zuletzt gefahrenes Fahrzeug
  updated_at  timestamptz not null default now()
);

create index if not exists f1_stats_wins_idx    on public.f1_stats (wins desc, updated_at asc);
create index if not exists f1_stats_ha_hits_idx on public.f1_stats (ha_hits desc, updated_at asc);

-- 2) Row Level Security: jeder darf LESEN, niemand direkt schreiben.
alter table public.f1_stats enable row level security;

drop policy if exists "f1_stats lesen" on public.f1_stats;
create policy "f1_stats lesen" on public.f1_stats
  for select to anon, authenticated using (true);

-- Keine insert/update/delete-Policies → direkte Schreibzugriffe sind gesperrt.
revoke insert, update, delete, truncate on public.f1_stats from anon, authenticated;
grant select on public.f1_stats to anon, authenticated;

-- 3) RPC: Ergebnis eines Rennens melden (zählt hoch, legt Spieler bei Bedarf an).
--    Läuft als "security definer", damit es trotz RLS schreiben darf, prüft
--    aber alle Eingaben selbst.
create or replace function public.f1_add_result(p_name text, p_won boolean, p_hits integer, p_truck text default null)
returns public.f1_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name  text := left(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g'), 16);
  v_key   text;
  v_hits  integer := least(greatest(coalesce(p_hits, 0), 0), 20);   -- max. 20 Treffer pro Rennen
  v_truck text := left(nullif(trim(coalesce(p_truck, '')), ''), 40);
  v_row   public.f1_stats;
begin
  if char_length(v_name) < 2 then
    raise exception 'invalid name';
  end if;
  v_key := lower(v_name);

  -- einfacher Spam-Schutz: höchstens ein Ergebnis pro Name alle 20 Sekunden
  if exists (select 1 from public.f1_stats
             where player_key = v_key and updated_at > now() - interval '20 seconds') then
    select * into v_row from public.f1_stats where player_key = v_key;
    return v_row;
  end if;

  insert into public.f1_stats as s (player_key, player_name, wins, ha_hits, races, truck, updated_at)
  values (v_key, v_name, case when p_won then 1 else 0 end, v_hits, 1, v_truck, now())
  on conflict (player_key) do update
    set player_name = excluded.player_name,
        wins        = s.wins + excluded.wins,
        ha_hits     = s.ha_hits + excluded.ha_hits,
        races       = s.races + 1,
        truck       = coalesce(excluded.truck, s.truck),
        updated_at  = now()
  returning * into v_row;
  return v_row;
end;
$$;

revoke all on function public.f1_add_result(text, boolean, integer, text) from public;
grant execute on function public.f1_add_result(text, boolean, integer, text) to anon, authenticated;

-- Damit die API die neue Tabelle/Funktion sofort kennt:
notify pgrst, 'reload schema';

-- Optional zum Prüfen:
--   select * from public.f1_stats order by wins desc limit 15;
-- Zurücksetzen (Vorsicht, löscht alle Einträge):
--   truncate public.f1_stats;

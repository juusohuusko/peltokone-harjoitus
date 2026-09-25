-- Asiakaspäivän ilmoittautumiset (Supabase-projekti peltokone-demo)
create table if not exists public.ilmoittautumiset (
  id          bigint generated always as identity primary key,
  luotu       timestamptz not null default now(),
  nimi        text not null check (char_length(nimi) between 2 and 100),
  tila        text not null check (char_length(tila) between 1 and 100),
  kunta       text not null check (char_length(kunta) between 1 and 60),
  sahkoposti  text check (sahkoposti is null or char_length(sahkoposti) <= 120),
  puhelin     text check (puhelin is null or char_length(puhelin) <= 30),
  henkia      smallint not null check (henkia between 1 and 10),
  lahde       text not null default 'verkko' check (lahde in ('verkko', 'puhelin'))
);

-- Sama sähköposti vain kerran (kirjainkoolla ei väliä)
create unique index if not exists ilmoittautumiset_sahkoposti_uniikki
  on public.ilmoittautumiset (lower(sahkoposti)) where sahkoposti is not null;

-- RLS päälle ilman sääntöjä: julkinen (anon) avain ei pääse tauluun lainkaan.
-- Vain Worker lukee ja kirjoittaa palveluavaimella.
alter table public.ilmoittautumiset enable row level security;
revoke all on public.ilmoittautumiset from anon, authenticated;

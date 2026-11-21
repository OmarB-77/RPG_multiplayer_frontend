# Cronache del Master — Frontend

Interfaccia web (React + Vite + TypeScript) per campagne di ruolo multigiocatore guidate da un Dungeon Master AI.

- **Legge** da Supabase (Auth + Realtime, protetto da RLS) con la chiave **anon** (pubblica).
- **Scrive** solo tramite il backend (`VITE_API_URL`), che verifica il JWT dell'utente.
- Il backend vive in un repository separato e privato: `RPG_multiplayer_backend`.

## Avvio in locale

```bash
npm install
cp .env.example .env.local     # compila le variabili
npm run dev                    # http://localhost:5173
```

Servono: il progetto Supabase con la migrazione del backend già eseguita, e il backend in esecuzione.

## Variabili d'ambiente (solo valori pubblici!)

| Variabile | Descrizione |
|---|---|
| `VITE_SUPABASE_URL` | URL del progetto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chiave **anon**. Mai la service role |
| `VITE_API_URL` | URL del backend |

## Struttura

```
src/App.tsx                  sessione, routing (hash #/c/<id>)
src/hooks/useCampaign.ts     caricamento + Realtime della stanza
src/lib/api.ts               chiamate al backend con JWT
src/components/Login         accesso / registrazione
src/components/CampaignList  elenco, creazione, ingresso con codice
src/components/Room          stanza: finestra comune, gruppo, azioni
src/components/SystemPicker  sessione zero: scelta sistema e tono
src/components/PrivateWindow pop-up privato: chat con il Master, scheda, tiri segreti
src/components/CharacterPanel importa/crea/modifica schede
src/components/DiceCard      richiesta di tiro (pulsante "Tira")
```

## Deploy (Vercel o Netlify)

1. Importa questo repository.
2. Build: `npm run build` — output: `dist`.
3. Imposta le tre variabili `VITE_*` nell'hosting.
4. Aggiungi l'URL pubblico a `CORS_ORIGINS` nel backend e agli URL consentiti in Supabase (Auth → URL Configuration).

## Note

- Le chat private sono visibili solo al proprietario del thread grazie alla RLS nel database, non solo all'interfaccia.
- Le carte pubbliche degli altri giocatori arrivano da una vista e si aggiornano ogni 20 secondi.
- Tema scuro di default, layout responsive.

# Grogu Date

Una pagina singola da condividere via email o WhatsApp: una domanda, due pulsanti.
Il pulsante **No** scappa dal cursore; se viene inseguito per 3 secondi di fila
compare un popup che chiede conferma. La risposta (sì con data, oppure no) arriva
per email.

## Come funziona

1. **Sì** → si apre il selettore data (`<input type="date">`, anteprima in italiano)
   e con _Invia_ parte l'email con la data scelta.
2. **No** → il pulsante schiva il cursore (posizione `fixed` in un portal, salti
   calcolati per restare nel viewport). Dopo 3 secondi di inseguimento continuo,
   o 8 tap su mobile, si apre il modal _"Mi vuoi spezzare il cuore davvero così?"_.
   - _No, ci ripenso_ → il modal si chiude e la caccia può continuare.
   - _Sì, voglio spezzarlo_ → cuore spezzato, "Il giorno più triste della mia vita"
     e email con risposta **no**.

## Setup

```bash
cp .env.example .env.local   # poi compila le variabili
npm run dev
```

Variabili (vedi [.env.example](.env.example)):

| Variabile              | Cosa fa                                                        |
| ---------------------- | -------------------------------------------------------------- |
| `RESEND_API_KEY`       | API key [Resend](https://resend.com) per l'invio               |
| `DATE_MAIL_TO`         | Destinatario della risposta                                    |
| `DATE_MAIL_FROM`       | Mittente verificato su Resend                                  |
| `SENDER_NAME`          | Nome mostrato in pagina ("Trasmissione da …")                   |
| `NEXT_PUBLIC_SITE_URL` | URL pubblico, serve per la preview OG su WhatsApp               |

Senza `RESEND_API_KEY` / `DATE_MAIL_TO` la pagina funziona comunque: la risposta
viene scritta nel log del server invece di essere spedita.

## Struttura

- [app/page.tsx](app/page.tsx) — Server Component, starfield + card
- [app/actions.ts](app/actions.ts) — Server Action con validazione data e rate limit
- [app/lib/mailer.ts](app/lib/mailer.ts) — client Resend via `fetch`, zero dipendenze
- [app/\_components/](app/_components/) — UI: `DateInvite` (macchina a stati),
  `RunawayNoButton`, `HeartbreakModal`, `Grogu`/`BrokenHeart` (SVG inline)

Stack: Next.js 16 (App Router), React 19, Tailwind CSS v4.

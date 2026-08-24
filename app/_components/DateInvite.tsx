"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendAnswer } from "@/app/actions";
import { ACTIVITIES, findActivity, type ActivityId } from "@/app/lib/activities";
import { BrokenHeart } from "./BrokenHeart";
import { Grogu, type GroguMood } from "./Grogu";
import { HeartbreakModal } from "./HeartbreakModal";
import { RunawayNoButton } from "./RunawayNoButton";

type Phase = "ask" | "activity" | "date" | "accepted" | "rejected";

/** Time the picked card stays highlighted before the date step slides in. */
const HANDOFF_MS = 480;

/** Distance from the "Sì" button that counts as heading for it. */
const YES_RADIUS = 150;

function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatItalian(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const formatted = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function DateInvite({ senderName }: { senderName: string }) {
  const [phase, setPhase] = useState<Phase>("ask");
  const [modalOpen, setModalOpen] = useState(false);
  const [date, setDate] = useState("");
  const [activity, setActivity] = useState<ActivityId | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nearYes, setNearYes] = useState(false);
  const [chasingNo, setChasingNo] = useState(false);

  const yesRef = useRef<HTMLButtonElement | null>(null);
  const nearYesRef = useRef(false);
  const chosen = findActivity(activity);

  // Watch how close the pointer gets to "Sì". Only tracked while asking; a
  // stale value is harmless because the mood below reads it only in that phase.
  useEffect(() => {
    if (phase !== "ask") return;

    const onMove = (event: PointerEvent) => {
      const el = yesRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const distance = Math.hypot(
        rect.left + rect.width / 2 - event.clientX,
        rect.top + rect.height / 2 - event.clientY,
      );
      const near = distance < YES_RADIUS;
      if (nearYesRef.current === near) return;
      nearYesRef.current = near;
      setNearYes(near);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [phase]);

  // Heading for "Sì" wins over the chase: right after the No button hops away
  // it can still sit within chase range of a pointer that is going for "Sì".
  const mood: GroguMood =
    phase === "rejected"
      ? "sad"
      : phase === "accepted"
        ? "happy"
        : phase === "ask"
          ? nearYes
            ? "happy"
            : chasingNo
              ? "crying"
              : "hopeful"
          : "hopeful";

  const submit = useCallback(
    async (answer: "yes" | "no", isoDate?: string, activityId?: ActivityId | null) => {
      setSending(true);
      setError(null);
      const result = await sendAnswer({
        answer,
        date: isoDate ?? null,
        activity: activityId ?? null,
      });
      setSending(false);
      if (result.status === "error") {
        setError(result.message ?? "Qualcosa è andato storto.");
        return false;
      }
      return true;
    },
    [],
  );

  const confirmHeartbreak = useCallback(() => {
    setModalOpen(false);
    setPhase("rejected");
    void submit("no");
  }, [submit]);

  const confirmDate = useCallback(async () => {
    if (!date) return;
    if (await submit("yes", date, activity)) setPhase("accepted");
  }, [activity, date, submit]);

  // Let the picked card show its selected state before moving on.
  const handoffRef = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(handoffRef.current), []);

  const chooseActivity = useCallback((id: ActivityId) => {
    setActivity(id);
    window.clearTimeout(handoffRef.current);
    handoffRef.current = window.setTimeout(() => setPhase("date"), HANDOFF_MS);
  }, []);

  return (
    <>
      <section className="relative w-full max-w-xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-force/15 bg-void-700/60 px-6 py-10 text-center shadow-[0_40px_120px_-40px_rgba(168,211,138,0.35)] backdrop-blur-xl transition-all duration-500 sm:px-10 sm:py-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(75%_100%_at_50%_0%,rgba(168,211,138,0.2),transparent)]"
          />

          <div className="relative mx-auto w-44 animate-float sm:w-52">
            <Grogu
              mood={mood}
              className="h-auto w-full drop-shadow-[0_18px_35px_rgba(0,0,0,0.55)] transition-all duration-700"
            />
          </div>

          {phase === "ask" && (
            <div key="ask" className="animate-rise">
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-force/70">
                Trasmissione da {senderName}
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-balance text-sand sm:text-4xl">
                Ciao! Io e Grogu ci chiediamo se ti andrebbe di uscire una di queste sere?
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-pretty text-sm leading-relaxed text-sand/60 sm:text-base">
                Seleziona una risposta, ma ti avverto: Grogu è suscettibile alla risposta!
              </p>

              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <button
                  ref={yesRef}
                  type="button"
                  onClick={() => setPhase("activity")}
                  className="rounded-full bg-force px-9 py-3.5 text-lg font-semibold text-void shadow-[0_0_0_0_rgba(168,211,138,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-force/90 hover:shadow-[0_14px_38px_-10px_rgba(168,211,138,0.85)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-force active:translate-y-0"
                >
                  Sì
                </button>
                <RunawayNoButton
                  paused={modalOpen}
                  onCaught={() => setModalOpen(true)}
                  onChasingChange={setChasingNo}
                />
              </div>
            </div>
          )}

          {phase === "activity" && (
            <div key="activity" className="animate-rise">
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-force/70">
                Hai detto di sì! ☺️
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-balance text-sand sm:text-4xl">
                Cosa ti andrebbe di fare?
              </h1>

              <div
                role="radiogroup"
                aria-label="Cosa ti andrebbe di fare?"
                className="mt-8 flex flex-wrap justify-center gap-3"
              >
                {ACTIVITIES.map((option, index) => {
                  const selected = activity === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => chooseActivity(option.id)}
                      style={{ animationDelay: `${index * 55}ms` }}
                      className={`flex w-30 animate-rise flex-col items-center gap-2 rounded-2xl border px-3 py-4 transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-force sm:w-32 ${
                        selected
                          ? "border-force/70 bg-force/15 shadow-[0_0_30px_-8px_rgba(168,211,138,0.8)]"
                          : "border-force/15 bg-white/5 hover:border-force/40 hover:bg-force/10"
                      }`}
                    >
                      <span className="text-3xl leading-none" aria-hidden>
                        {option.icon}
                      </span>
                      <span
                        className={`text-sm font-medium transition-colors duration-300 ${
                          selected ? "text-force" : "text-sand/75"
                        }`}
                      >
                        {option.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setPhase("ask")}
                className="mt-7 rounded-full px-5 py-3 text-sm text-sand/50 transition-colors duration-300 hover:text-sand/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand/40"
              >
                Indietro
              </button>
            </div>
          )}

          {phase === "date" && (
            <div key="date" className="animate-rise">
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-force/70">
                La Forza è con noi
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-balance text-sand sm:text-4xl">
                Scegli un giorno
              </h1>

              {chosen && (
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-force/20 bg-force/10 px-4 py-2 text-sm text-force">
                  <span aria-hidden>{chosen.icon}</span>
                  {chosen.label}
                </p>
              )}

              <label
                htmlFor="date-input"
                className="mt-8 block text-left text-sm font-medium text-sand/70"
              >
                Quando ci vediamo?
              </label>
              <input
                id="date-input"
                type="date"
                lang="it-IT"
                value={date}
                min={todayIso()}
                onChange={(event) => setDate(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-force/25 bg-void/70 px-5 py-4 text-lg text-sand outline-none transition-all duration-300 [color-scheme:dark] focus:border-force/70 focus:shadow-[0_0_0_4px_rgba(168,211,138,0.15)]"
              />

              <p
                className={`mt-3 min-h-6 text-left text-sm transition-all duration-500 ${
                  date ? "text-force opacity-100" : "text-sand/40 opacity-70"
                }`}
              >
                {date ? formatItalian(date) : "Formato: giorno / mese / anno"}
              </p>

              {error && (
                <p className="mt-4 animate-shake rounded-xl border border-heart/30 bg-heart/10 px-4 py-3 text-sm text-heart">
                  {error}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={!date || sending}
                  onClick={confirmDate}
                  className="rounded-full bg-force px-10 py-3.5 text-lg font-semibold text-void transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_38px_-10px_rgba(168,211,138,0.85)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-force disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                >
                  {sending ? "Invio…" : "Invia"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setPhase("activity");
                  }}
                  className="rounded-full px-5 py-3 text-sm text-sand/50 transition-colors duration-300 hover:text-sand/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sand/40"
                >
                  Indietro
                </button>
              </div>
            </div>
          )}

          {phase === "accepted" && (
            <div key="accepted" className="animate-rise">
              <p className="mt-6 text-xs uppercase tracking-[0.3em] text-force/70">
                Risposta inviata
              </p>
              <h1 className="mt-4 text-3xl font-semibold leading-tight text-balance text-sand sm:text-4xl">
                Ci vediamo!
              </h1>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                {chosen && (
                  <p className="inline-flex items-center gap-2 rounded-2xl border border-force/25 bg-force/10 px-5 py-4 text-lg font-semibold text-force">
                    <span aria-hidden>{chosen.icon}</span>
                    {chosen.label}
                  </p>
                )}
                <p className="rounded-2xl border border-force/25 bg-force/10 px-5 py-4 text-lg font-semibold text-force">
                  {formatItalian(date)}
                </p>
              </div>
              <p className="mx-auto mt-6 max-w-sm text-pretty text-sm text-sand/60">
                Ho ricevuto la tua risposta. Grogu approva, e Grogu non approva quasi mai.
              </p>
              {sending && <p className="mt-4 text-xs text-sand/40">Invio in corso…</p>}
            </div>
          )}

          {phase === "rejected" && (
            <div key="rejected" className="animate-rise">
              <div className="mx-auto mt-4 w-32">
                <BrokenHeart className="h-auto w-full" />
              </div>
              <h1 className="mt-6 text-3xl font-semibold leading-tight text-balance text-sand sm:text-4xl">
                Il giorno più triste della mia vita.
              </h1>
              <p className="mx-auto mt-4 max-w-sm text-pretty text-sm text-sand/55">
                Nessun rancore. Solo un piccolo alieno verde che ora piange.
              </p>
              {error ? (
                <button
                  type="button"
                  onClick={() => void submit("no")}
                  className="mt-6 rounded-full border border-heart/40 px-6 py-2.5 text-sm text-heart transition-colors duration-300 hover:bg-heart/10"
                >
                  Riprova a inviare
                </button>
              ) : (
                <p className="mt-6 text-xs text-sand/35">
                  {sending ? "Invio della risposta…" : "Risposta inviata."}
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {modalOpen && (
        <HeartbreakModal onConfirm={confirmHeartbreak} onDismiss={() => setModalOpen(false)} />
      )}
    </>
  );
}

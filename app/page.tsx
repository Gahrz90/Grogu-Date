import { DateInvite } from "./_components/DateInvite";
import { Starfield } from "./_components/Starfield";

export default function Page() {
  const senderName = process.env.SENDER_NAME ?? "Gianluca";

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-14">
      <Starfield />
      <DateInvite senderName={senderName} />
      <p className="mt-10 text-center text-[11px] uppercase tracking-[0.25em] text-sand/25">
        This is the way
      </p>
    </main>
  );
}

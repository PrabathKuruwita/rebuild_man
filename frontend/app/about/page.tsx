import Link from "next/link";

const pillars = [
  {
    title: "Donation Visibility",
    text: "We make active needs and donation progress visible so supporters can act quickly and confidently.",
  },
  {
    title: "Trusted Coordination",
    text: "Hospitals, organizations, and donors work from a shared source of truth for requests and deliveries.",
  },
  {
    title: "Community Impact",
    text: "The platform helps convert scattered goodwill into measurable, trackable support across Sri Lanka.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-indigo-50">
      <section className="relative overflow-hidden border-b border-sky-100 bg-linear-to-r from-sky-700 via-blue-700 to-indigo-700 px-4 py-16 sm:px-6 lg:px-8">
        <div className="absolute -top-16 right-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="mx-auto max-w-6xl">
          <p className="inline-flex rounded-full border border-white/30 bg-white/15 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            About NeedTracker
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Turning donation needs into clear action and measurable impact.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-sky-50 sm:text-lg">
            NeedTracker helps organizations publish urgent needs, donors discover where support matters most, and administrators monitor how contributions change outcomes.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/" className="rounded-lg bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
              View Impact Stories
            </Link>
            <Link href="/needs" className="rounded-lg border border-white/40 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
              Browse Active Needs
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-2xl border border-blue-100 bg-white/90 p-6 shadow-sm backdrop-blur-sm">
              <h2 className="text-xl font-bold text-gray-900">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-6 text-gray-600">{pillar.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-slate-100 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-gray-900">Our mission</h2>
          <p className="mt-4 max-w-4xl text-base leading-7 text-gray-600">
            The platform exists to reduce friction in donation coordination. Instead of relying on scattered messages and manual follow-ups, NeedTracker organizes requests, tracks progress, and highlights where help is still needed.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl bg-sky-50 p-5">
              <p className="text-sm font-medium text-sky-700">Transparent needs</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">Visible</p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-5">
              <p className="text-sm font-medium text-emerald-700">Faster response</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">Connected</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-5">
              <p className="text-sm font-medium text-amber-700">Better outcomes</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">Measured</p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-5">
              <p className="text-sm font-medium text-indigo-700">Community trust</p>
              <p className="mt-1 text-2xl font-bold text-gray-900">Strengthened</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

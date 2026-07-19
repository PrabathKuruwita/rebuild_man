import Link from "next/link";

const contacts = [
  {
    label: "General Support",
    value: "support@needtracker.lk",
  },
  {
    label: "Partnerships",
    value: "partners@needtracker.lk",
  },
  {
    label: "Phone",
    value: "+94 11 234 5678",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 via-white to-cyan-50">
      <section className="border-b border-emerald-100 bg-linear-to-r from-emerald-700 via-teal-700 to-cyan-700 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            Contact Us
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Talk to the team behind the platform.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-emerald-50 sm:text-lg">
            Whether you need help with an account, want to report an issue, or are looking to collaborate, we would like to hear from you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {contacts.map((item) => (
            <article key={item.label} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-500">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-gray-900">{item.value}</p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-2xl border border-cyan-100 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Message us</h2>
            <p className="mt-3 text-sm leading-7 text-gray-600">
              Share your question and we’ll direct it to the right team member. For urgent platform issues, use the support email so we can respond quickly.
            </p>
            <div className="mt-5 rounded-xl bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-800">Response time</p>
              <p className="mt-1 text-sm text-gray-600">Most inquiries receive a response within one business day.</p>
            </div>
          </article>

          <article className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900">Quick links</h2>
            <div className="mt-4 space-y-3 text-sm font-semibold">
              <Link href="/" className="block text-emerald-700 hover:text-emerald-800">
                View platform impact
              </Link>
              <Link href="/about" className="block text-emerald-700 hover:text-emerald-800">
                Learn about the platform
              </Link>
              <Link href="/privacy" className="block text-emerald-700 hover:text-emerald-800">
                Read privacy policy
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}

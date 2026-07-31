import Link from "next/link";

const supportChannels = [
  {
    title: "Facebook Support",
    description:
      "Message the official Seamarino eSIM Facebook page for product, payment, and installation assistance.",
    label: "Open Facebook",
    href: "https://www.facebook.com/profile.php?id=61572608919128",
    external: true,
    icon: FacebookIcon,
    accent: "from-blue-500 to-indigo-700",
  },
  {
    title: "Order Assistance",
    description:
      "Prepare your order reference, checkout email, device model, and screenshots before contacting support.",
    label: "Read Order FAQs",
    href: "/faq",
    external: false,
    icon: OrderIcon,
    accent: "from-cyan-400 to-blue-600",
  },
  {
    title: "Plan Assistance",
    description:
      "Get help comparing local, regional, and global plans for your destination or international route.",
    label: "Browse Plans",
    href: "/shop",
    external: false,
    icon: GlobeIcon,
    accent: "from-emerald-400 to-teal-600",
  },
];

const preparationItems = [
  {
    title: "Order reference",
    description:
      "Include the SEAMARINO reference shown after checkout.",
  },
  {
    title: "Checkout email",
    description:
      "Use the same email address entered during your purchase.",
  },
  {
    title: "Device details",
    description:
      "Include your phone brand, model, and operating-system version.",
  },
  {
    title: "Screenshots",
    description:
      "Attach clear screenshots when reporting an installation error.",
  },
];

const serviceTopics = [
  "Plan selection",
  "Device compatibility",
  "Payment verification",
  "eSIM installation",
  "Order delivery",
  "Refund assistance",
];

export default function ContactPage() {
  return (
    <main className="overflow-hidden bg-slate-50">
      <ContactHero />

      <SupportChannels />

      <ContactFormSection />

      <PreparationSection />

      <FinalHelpSection />
    </main>
  );
}

function ContactHero() {
  return (
    <section className="relative overflow-hidden bg-[#061936] text-white">
      <div
        className="absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-sky-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-40 bottom-0 h-[34rem] w-[34rem] rounded-full bg-blue-500/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <svg
          viewBox="0 0 1440 720"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <pattern
              id="contact-grid"
              width="65"
              height="65"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M65 0H0V65"
                fill="none"
                stroke="white"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>

          <rect
            width="100%"
            height="100%"
            fill="url(#contact-grid)"
          />

          <path
            d="M-70 585C245 395 460 700 770 500C1025 336 1220 445 1510 230"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray="10 12"
          />

          <path
            d="M-70 680C260 540 525 730 840 585C1080 475 1280 510 1500 410"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            strokeDasharray="8 14"
          />
        </svg>
      </div>

      <div className="relative mx-auto grid min-h-[680px] max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.85fr] lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-black text-sky-200 backdrop-blur">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-400/15">
              <SupportIcon />
            </span>

            Seamarino Customer Support
          </span>

          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Support for every
            <span className="block bg-gradient-to-r from-sky-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
              part of your journey.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
            Get help choosing a plan, checking compatibility,
            confirming an order, or installing your Seamarino eSIM.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <a
              href="https://www.facebook.com/profile.php?id=61572608919128"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-black text-[#0A2D62] shadow-xl transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Message on Facebook
              <ArrowIcon />
            </a>

            <Link
              href="/faq"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-7 py-4 font-black text-white backdrop-blur transition hover:bg-white/20"
            >
              Visit Help Center
            </Link>
          </div>

          <div className="mt-9 flex flex-wrap gap-3">
            {[
              "Plan assistance",
              "Installation guidance",
              "Order support",
            ].map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-xs text-[#061936]">
                  ✓
                </span>

                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="relative mx-auto hidden w-full max-w-md lg:block">
          <div className="rounded-[2.5rem] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur">
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-800 to-[#061936] p-7">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
                    Support Center
                  </p>

                  <h2 className="mt-3 text-3xl font-black">
                    How can we help?
                  </h2>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
                  <HeadsetIcon />
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {serviceTopics.slice(0, 4).map((topic, index) => (
                  <div
                    key={topic}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-[#0A2D62]">
                      {index + 1}
                    </span>

                    <p className="font-bold text-white">
                      {topic}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex items-center gap-3 rounded-2xl bg-emerald-400/15 p-4">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />

                <p className="text-sm font-bold text-emerald-200">
                  Facebook support available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SupportChannels() {
  return (
    <section className="border-b border-slate-200 bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Support channels"
          title="Choose the help you need"
          description="Use the official Seamarino support options for plan, order, and installation questions."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {supportChannels.map((channel) => {
            const Icon = channel.icon;

            const className =
              "group relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-2 hover:border-blue-300 hover:shadow-2xl";

            const content = (
              <>
                <div
                  className={`absolute inset-x-0 top-0 h-2 bg-gradient-to-r ${channel.accent}`}
                />

                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${channel.accent} text-white shadow-lg`}
                >
                  <Icon />
                </div>

                <h2 className="mt-7 text-2xl font-black text-[#0A2D62]">
                  {channel.title}
                </h2>

                <p className="mt-4 min-h-24 leading-7 text-slate-600">
                  {channel.description}
                </p>

                <span className="mt-7 inline-flex items-center gap-2 font-black text-blue-700">
                  {channel.label}
                  <ArrowIcon />
                </span>
              </>
            );

            return channel.external ? (
              <a
                key={channel.title}
                href={channel.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            ) : (
              <Link
                key={channel.title}
                href={channel.href}
                className={className}
              >
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ContactFormSection() {
  return (
    <section className="relative overflow-hidden bg-slate-50 py-20 sm:py-24">
      <div
        className="absolute -left-32 top-10 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.75fr_1.25fr] lg:px-8">
        <aside className="space-y-6">
          <div className="rounded-[2rem] bg-[#071f45] p-7 text-white shadow-2xl">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
              <InformationIcon />
            </div>

            <h2 className="mt-6 text-3xl font-black">
              Before sending a message
            </h2>

            <p className="mt-4 leading-8 text-blue-100">
              Providing complete information helps support understand
              your issue more quickly.
            </p>

            <div className="mt-7 space-y-4">
              {preparationItems.map((item, index) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/10 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-black text-[#0A2D62]">
                    {index + 1}
                  </span>

                  <div>
                    <p className="font-black text-white">
                      {item.title}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-blue-100">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
              Common support topics
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              {serviceTopics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </aside>

        <section className="overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="bg-gradient-to-r from-[#071f45] via-[#0A2D62] to-blue-700 px-7 py-8 text-white sm:px-9">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
              Send a support request
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Tell us how we can help
            </h2>

            <p className="mt-3 max-w-2xl leading-7 text-blue-100">
              Complete the form with accurate contact and order
              information.
            </p>
          </div>

          <form className="space-y-6 p-7 sm:p-9">
            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                id="contact-name"
                name="name"
                label="Full name"
                type="text"
                placeholder="Juan Dela Cruz"
                autoComplete="name"
                icon={<UserIcon />}
              />

              <FormField
                id="contact-email"
                name="email"
                label="Email address"
                type="email"
                placeholder="juan@example.com"
                autoComplete="email"
                icon={<EmailIcon />}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <FormField
                id="contact-phone"
                name="phone"
                label="Phone number"
                type="tel"
                placeholder="+63 912 345 6789"
                autoComplete="tel"
                icon={<PhoneIcon />}
              />

              <FormField
                id="contact-reference"
                name="reference"
                label="Order reference"
                optional
                type="text"
                placeholder="SEAMARINO-..."
                icon={<OrderIcon />}
              />
            </div>

            <div>
              <label
                htmlFor="contact-topic"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Support topic
              </label>

              <div className="relative">
                <select
                  id="contact-topic"
                  name="topic"
                  required
                  defaultValue=""
                  className="h-16 w-full appearance-none rounded-2xl border border-slate-300 bg-white px-5 pr-12 text-base font-semibold text-slate-950 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="" disabled>
                    Select a support topic
                  </option>

                  {serviceTopics.map((topic) => (
                    <option key={topic} value={topic}>
                      {topic}
                    </option>
                  ))}
                </select>

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="pointer-events-none absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                  aria-hidden="true"
                >
                  <path
                    d="m7 10 5 5 5-5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div>
              <label
                htmlFor="contact-message"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Message
              </label>

              <textarea
                id="contact-message"
                name="message"
                required
                rows={7}
                placeholder="Describe your issue, device model, destination, and any error message..."
                className="w-full resize-none rounded-2xl border border-slate-300 bg-white px-5 py-4 text-base font-medium text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <input
                type="checkbox"
                required
                className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 accent-[#0A2D62]"
              />

              <span className="text-sm leading-7 text-slate-700">
                I confirm that the information provided is accurate
                and may be used to respond to this support request.
              </span>
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-7 py-4 font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-600 hover:shadow-xl"
            >
              Send Support Request
              <ArrowIcon />
            </button>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                  <InformationIcon />
                </div>

                <div>
                  <p className="font-black text-amber-950">
                    Form connection still required
                  </p>

                  <p className="mt-2 text-sm leading-7 text-amber-800">
                    This form is currently visual only. It must be
                    connected to an API route or email service before
                    submissions can be delivered.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}

function PreparationSection() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Faster assistance"
          title="Help us understand the issue"
          description="The right information can reduce delays when diagnosing installation, payment, or delivery problems."
        />

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {preparationItems.map((item, index) => (
            <article
              key={item.title}
              className="rounded-[2rem] border border-slate-200 bg-slate-50 p-7 transition hover:-translate-y-2 hover:border-blue-300 hover:shadow-xl"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0A2D62] text-lg font-black text-white">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h2 className="mt-6 text-xl font-black text-slate-950">
                {item.title}
              </h2>

              <p className="mt-3 leading-7 text-slate-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalHelpSection() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-[#061936] via-[#0A2D62] to-blue-700 px-6 py-14 text-white shadow-2xl sm:px-10 lg:px-16">
        <div
          className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-amber-300/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
              Need a quick answer?
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Visit the Seamarino Help Center.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
              Review guidance about compatibility, installation,
              payments, delivery, top-ups, and refunds.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/faq"
              className="inline-flex min-w-48 items-center justify-center rounded-2xl bg-white px-7 py-4 font-black text-[#0A2D62] transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Browse FAQs
            </Link>

            <Link
              href="/shop"
              className="inline-flex min-w-48 items-center justify-center rounded-2xl border border-white/30 bg-white/10 px-7 py-4 font-black text-white transition hover:bg-white/20"
            >
              Browse Plans
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function SectionHeading({
  eyebrow,
  title,
  description,
}: SectionHeadingProps) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-black uppercase tracking-[0.22em] text-blue-600">
        {eyebrow}
      </p>

      <h2 className="mt-4 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
        {title}
      </h2>

      <p className="mt-5 text-lg leading-8 text-slate-600">
        {description}
      </p>
    </div>
  );
}

type FormFieldProps = {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  autoComplete?: string;
  optional?: boolean;
};

function FormField({
  id,
  name,
  label,
  type,
  placeholder,
  icon,
  autoComplete,
  optional = false,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-bold text-slate-800"
      >
        {label}

        {optional && (
          <span className="ml-1 font-normal text-slate-500">
            (optional)
          </span>
        )}
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
          {icon}
        </div>

        <input
          id={id}
          name={name}
          type={type}
          required={!optional}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="h-16 w-full rounded-2xl border border-slate-300 bg-white pl-14 pr-5 text-base font-semibold text-slate-950 outline-none transition placeholder:font-normal placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 transition-transform group-hover:translate-x-1"
      aria-hidden="true"
    >
      <path
        d="M5 12h14M13 6l6 6-6 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M4 13v-1a8 8 0 0 1 16 0v1"
        strokeLinecap="round"
      />

      <path
        d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeadsetIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path
        d="M4 13v-1a8 8 0 0 1 16 0v1"
        strokeLinecap="round"
      />

      <path
        d="M4 13a2 2 0 0 1 2-2h1v6H6a2 2 0 0 1-2-2v-2ZM20 13a2 2 0 0 0-2-2h-1v6h1a2 2 0 0 0 2-2v-2Z"
        strokeLinejoin="round"
      />

      <path
        d="M17 18c-.8 2-2.5 3-5 3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path d="M13.5 21v-8h2.8l.4-3h-3.2V8.1c0-.9.3-1.6 1.7-1.6H17V3.8c-.3 0-1.4-.1-2.6-.1-2.6 0-4.4 1.6-4.4 4.5V10H7v3h3v8h3.5Z" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <path
        d="M7 3h7l4 4v14H7V3Z"
        strokeLinejoin="round"
      />

      <path d="M14 3v5h5" strokeLinejoin="round" />

      <path
        d="M10 12h4M10 15h4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-8 w-8"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />

      <path
        d="M3 12h18M12 3c2.4 2.6 3.7 5.6 3.7 9S14.4 18.4 12 21M12 3C9.6 5.6 8.3 8.6 8.3 12S9.6 18.4 12 21"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InformationIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />

      <path
        d="M12 11v6M12 7.5h.01"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="4" />

      <path
        d="M4 21a8 8 0 0 1 16 0"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />

      <path
        d="m4 7 8 6 8-6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        d="M7 3h3l1.5 4-2 1.5a15 15 0 0 0 6 6l1.5-2L21 14v3a4 4 0 0 1-4 4C9.3 21 3 14.7 3 7a4 4 0 0 1 4-4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
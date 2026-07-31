"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type FaqCategory =
  | "All"
  | "Getting Started"
  | "Compatibility"
  | "Installation"
  | "Payments"
  | "Refunds";

type FaqItem = {
  category: Exclude<FaqCategory, "All">;
  question: string;
  answer: string;
};

const categories: FaqCategory[] = [
  "All",
  "Getting Started",
  "Compatibility",
  "Installation",
  "Payments",
  "Refunds",
];

const faqs: FaqItem[] = [
  {
    category: "Getting Started",
    question: "What is an eSIM?",
    answer:
      "An eSIM is a digital SIM built into compatible mobile devices. It lets you activate a mobile data package without inserting a physical SIM card.",
  },
  {
    category: "Getting Started",
    question: "How do I receive my Seamarino eSIM?",
    answer:
      "After your payment is confirmed and the order is processed, your eSIM installation details will be sent to the email address entered during checkout.",
  },
  {
    category: "Getting Started",
    question: "Can I keep using my physical SIM?",
    answer:
      "Most compatible dual-SIM devices allow you to keep your physical SIM active for calls and messages while using the eSIM for mobile data.",
  },
  {
    category: "Compatibility",
    question: "Does my phone support eSIM?",
    answer:
      "Compatibility depends on your device model, regional version, operating system, and carrier-lock status. Confirm that the device supports eSIM and is carrier-unlocked before purchasing.",
  },
  {
    category: "Compatibility",
    question: "Can I use an eSIM on a carrier-locked phone?",
    answer:
      "A carrier-locked device may block eSIM plans from other providers. Contact your mobile carrier to confirm whether your phone is unlocked before purchasing.",
  },
  {
    category: "Compatibility",
    question: "Can I install the same eSIM on multiple devices?",
    answer:
      "An eSIM is generally intended for one compatible device and may only be installed once. Do not delete or transfer it unless the plan instructions specifically allow it.",
  },
  {
    category: "Installation",
    question: "When should I install my eSIM?",
    answer:
      "Install it before traveling while you have a stable internet connection. Activate mobile data according to the instructions and activation policy of your selected package.",
  },
  {
    category: "Installation",
    question: "What should I do if installation fails?",
    answer:
      "Do not delete the eSIM immediately. Check your internet connection, confirm device compatibility, restart the phone, and contact customer support with your order reference and device model.",
  },
  {
    category: "Installation",
    question: "Should data roaming be enabled?",
    answer:
      "Many travel eSIM packages require data roaming to be enabled on the eSIM line. Follow the installation instructions included with your specific plan.",
  },
  {
    category: "Installation",
    question: "Can I use hotspot or tethering?",
    answer:
      "Hotspot availability depends on the package, device, and local network operator. Review the plan details before purchasing.",
  },
  {
    category: "Installation",
    question: "Can I top up my eSIM?",
    answer:
      "Some packages support top-ups while others do not. The individual plan details page indicates whether top-up is supported.",
  },
  {
    category: "Payments",
    question: "Which payment methods are available?",
    answer:
      "Available methods depend on your PayMongo checkout configuration and may include cards, GCash, Maya, or QR Ph.",
  },
  {
    category: "Payments",
    question: "What happens after successful payment?",
    answer:
      "Your payment is verified by the server before the selected eSIM package is processed. The success page alone does not mean the eSIM has already been issued.",
  },
  {
    category: "Payments",
    question: "Why is my order still being verified?",
    answer:
      "Some payment methods take additional time to confirm. Keep your order reference and avoid purchasing the same package again while verification is in progress.",
  },
  {
    category: "Payments",
    question: "Where can I find my order reference?",
    answer:
      "The order reference appears on the checkout success page and may also be included in your confirmation email. Keep it for support inquiries.",
  },
  {
    category: "Refunds",
    question: "Can I request a refund?",
    answer:
      "Refund eligibility depends on the payment status, whether the eSIM has already been issued, installed, activated, or used, and the applicable refund policy.",
  },
  {
    category: "Refunds",
    question: "Can an activated eSIM be refunded?",
    answer:
      "An eSIM that has already been installed, activated, or used may no longer qualify for a refund. Contact support with your order reference for review.",
  },
  {
    category: "Refunds",
    question: "What information is needed for a refund request?",
    answer:
      "Provide your order reference, checkout email, device model, screenshots of any error, and a clear explanation of the issue.",
  },
];

const helpTopics = [
  {
    title: "Device Compatibility",
    description:
      "Check whether your phone supports eSIM and is carrier-unlocked.",
    icon: PhoneIcon,
    category: "Compatibility" as FaqCategory,
  },
  {
    title: "Installation Guide",
    description:
      "Learn when to install, activate, and configure mobile data.",
    icon: QrIcon,
    category: "Installation" as FaqCategory,
  },
  {
    title: "Payments and Orders",
    description:
      "Understand payment verification and order processing.",
    icon: PaymentIcon,
    category: "Payments" as FaqCategory,
  },
  {
    title: "Refund Assistance",
    description:
      "Review refund eligibility and required information.",
    icon: RefundIcon,
    category: "Refunds" as FaqCategory,
  },
];

export default function FaqPage() {
  const [selectedCategory, setSelectedCategory] =
    useState<FaqCategory>("All");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return faqs.filter((faq) => {
      const matchesCategory =
        selectedCategory === "All" ||
        faq.category === selectedCategory;

      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  function resetFilters() {
    setSearchTerm("");
    setSelectedCategory("All");
  }

  return (
    <main className="overflow-hidden bg-slate-50">
      <FaqHero
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <HelpTopics
        onSelectCategory={setSelectedCategory}
      />

      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[280px_1fr]">
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                  FAQ Categories
                </p>

                <div className="mt-5 space-y-2">
                  {categories.map((category) => {
                    const active =
                      category === selectedCategory;

                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() =>
                          setSelectedCategory(category)
                        }
                        className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
                          active
                            ? "bg-[#0A2D62] text-white shadow-lg"
                            : "bg-white text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                        }`}
                      >
                        <span>{category}</span>

                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            active
                              ? "bg-white/15 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {category === "All"
                            ? faqs.length
                            : faqs.filter(
                                (faq) =>
                                  faq.category === category,
                              ).length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-2xl bg-[#071f45] p-5 text-white">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-sky-300">
                    <SupportIcon />
                  </div>

                  <h2 className="mt-5 text-xl font-black">
                    Need personal assistance?
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-blue-100">
                    Contact support and include your order
                    reference or device model when applicable.
                  </p>

                  <Link
                    href="/contact"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-black text-[#0A2D62] transition hover:bg-slate-100"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </aside>

            <div>
              <div className="flex flex-col gap-4 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-blue-600">
                    Help Center
                  </p>

                  <h2 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
                    Frequently asked questions
                  </h2>

                  <p className="mt-3 text-slate-600">
                    Showing {filteredFaqs.length} of{" "}
                    {faqs.length} questions
                  </p>
                </div>

                {(searchTerm ||
                  selectedCategory !== "All") && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {filteredFaqs.length === 0 ? (
                <div className="mt-8 rounded-[2rem] border border-dashed border-slate-300 bg-slate-50 px-6 py-20 text-center">
                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <SearchIcon />
                  </div>

                  <h2 className="mt-6 text-2xl font-black text-slate-950">
                    No answers found
                  </h2>

                  <p className="mx-auto mt-3 max-w-md leading-7 text-slate-600">
                    Try another search phrase or select a
                    different FAQ category.
                  </p>

                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-7 rounded-2xl bg-[#0A2D62] px-7 py-3.5 font-black text-white transition hover:bg-blue-800"
                  >
                    View All Questions
                  </button>
                </div>
              ) : (
                <div className="mt-8 space-y-4">
                  {filteredFaqs.map((faq, index) => (
                    <details
                      key={faq.question}
                      className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition open:border-blue-300 open:shadow-lg"
                    >
                      <summary className="flex cursor-pointer list-none items-center gap-5 p-6 sm:p-7">
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-sm font-black text-blue-700 transition group-open:bg-[#0A2D62] group-open:text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-600">
                            {faq.category}
                          </p>

                          <h3 className="mt-2 text-lg font-black leading-7 text-slate-950 sm:text-xl">
                            {faq.question}
                          </h3>
                        </div>

                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl font-light text-[#0A2D62] transition duration-300 group-open:rotate-45 group-open:bg-blue-100">
                          +
                        </span>
                      </summary>

                      <div className="border-t border-slate-100 bg-slate-50/60 px-6 py-6 sm:px-7">
                        <p className="max-w-3xl pl-0 leading-8 text-slate-600 sm:pl-[68px]">
                          {faq.answer}
                        </p>
                      </div>
                    </details>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <CompatibilitySection />

      <FinalSupportSection />
    </main>
  );
}

type FaqHeroProps = {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
};

function FaqHero({
  searchTerm,
  setSearchTerm,
}: FaqHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#061936] text-white">
      <div
        className="absolute -left-40 top-0 h-[30rem] w-[30rem] rounded-full bg-sky-500/20 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-40 bottom-0 h-[32rem] w-[32rem] rounded-full bg-blue-500/25 blur-3xl"
        aria-hidden="true"
      />

      <div className="absolute inset-0 opacity-20" aria-hidden="true">
        <svg
          viewBox="0 0 1440 700"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <pattern
              id="faq-grid"
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
            fill="url(#faq-grid)"
          />

          <path
            d="M-100 580C240 380 470 700 760 500C1020 320 1220 450 1500 235"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3"
            strokeDasharray="10 12"
          />
        </svg>
      </div>

      <div className="relative mx-auto grid min-h-[650px] max-w-7xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_0.8fr] lg:px-8">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-black text-sky-200 backdrop-blur">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-400/15">
              ?
            </span>
            Seamarino Help Center
          </span>

          <h1 className="mt-7 max-w-4xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Answers for a
            <span className="block bg-gradient-to-r from-sky-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
              smoother journey.
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100 sm:text-xl">
            Find guidance about eSIM compatibility,
            installation, payments, delivery, top-ups, and
            refunds.
          </p>

          <div className="relative mt-9 max-w-2xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-5 text-slate-500">
              <SearchIcon />
            </div>

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search a question or topic..."
              aria-label="Search frequently asked questions"
              className="h-16 w-full rounded-2xl border border-white/20 bg-white pl-14 pr-5 text-base font-semibold text-slate-950 shadow-2xl outline-none placeholder:font-normal placeholder:text-slate-500 focus:ring-4 focus:ring-sky-300/30"
            />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {[
              "Compatibility",
              "Installation",
              "Payments",
              "Refunds",
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-bold text-blue-100"
              >
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
                    Help Center
                  </p>

                  <h2 className="mt-3 text-3xl font-black">
                    How can we help?
                  </h2>
                </div>

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
                  <SupportIcon />
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {[
                  "Device compatibility",
                  "eSIM installation",
                  "Payment verification",
                  "Refund assistance",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/10 p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sm font-black text-[#0A2D62]">
                      {index + 1}
                    </span>

                    <p className="font-bold text-white">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-7 flex items-center gap-3 rounded-2xl bg-emerald-400/15 p-4">
                <span className="h-3 w-3 rounded-full bg-emerald-400" />

                <p className="text-sm font-bold text-emerald-200">
                  Support guidance available
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type HelpTopicsProps = {
  onSelectCategory: (category: FaqCategory) => void;
};

function HelpTopics({
  onSelectCategory,
}: HelpTopicsProps) {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {helpTopics.map((topic) => {
            const Icon = topic.icon;

            return (
              <button
                key={topic.title}
                type="button"
                onClick={() =>
                  onSelectCategory(topic.category)
                }
                className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-2 hover:border-blue-300 hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 transition group-hover:bg-[#0A2D62] group-hover:text-white">
                  <Icon />
                </div>

                <h2 className="mt-6 text-xl font-black text-[#0A2D62]">
                  {topic.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {topic.description}
                </p>

                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-700">
                  View Answers
                  <span className="transition group-hover:translate-x-1">
                    →
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CompatibilitySection() {
  const checklist = [
    "The phone supports eSIM",
    "The device is carrier-unlocked",
    "A stable internet connection is available",
    "The selected plan covers the destination",
  ];

  return (
    <section className="bg-slate-50 px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-7xl items-center gap-12 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-xl sm:p-10 lg:grid-cols-2 lg:p-14">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
            <PhoneIcon />
            Before You Purchase
          </span>

          <h2 className="mt-6 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Confirm device compatibility first.
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Device compatibility can vary by model, region,
            operating system, and carrier. Complete these
            checks before purchasing an eSIM.
          </p>

          <div className="mt-8 space-y-4">
            {checklist.map((item) => (
              <div
                key={item}
                className="flex items-center gap-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
                  ✓
                </span>

                <p className="font-bold text-slate-700">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#0A2D62] px-7 py-4 font-black text-white transition hover:bg-blue-800"
          >
            Browse eSIM Plans
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="rounded-[2.5rem] bg-[#071f45] p-6 shadow-2xl">
          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-blue-800 to-[#061936] p-7">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-300">
                  Compatibility Check
                </p>

                <h3 className="mt-3 text-3xl font-black text-white">
                  Is your phone ready?
                </h3>
              </div>

              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-sky-300">
                <PhoneIcon />
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                ["eSIM support", "Required"],
                ["Carrier lock", "Unlocked"],
                ["Internet access", "Needed"],
                ["Plan coverage", "Confirm first"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-white/10 bg-white/10 p-5"
                >
                  <p className="text-xs font-black uppercase tracking-wide text-sky-300">
                    {label}
                  </p>

                  <p className="mt-2 font-black text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FinalSupportSection() {
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
              Still need assistance?
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              Our support page is ready to help.
            </h2>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-100">
              Include your device model, order reference, and
              screenshots when contacting support about an
              installation or payment issue.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-w-48 items-center justify-center rounded-2xl bg-white px-7 py-4 font-black text-[#0A2D62] transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Contact Support
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

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />

      <path d="m20 20-4-4" strokeLinecap="round" />
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
      className="h-7 w-7"
      aria-hidden="true"
    >
      <rect x="7" y="2" width="10" height="20" rx="2" />

      <path d="M10 18h4" strokeLinecap="round" />
    </svg>
  );
}

function QrIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="15" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="15" width="6" height="6" rx="1" />

      <path
        d="M15 15h2v2h-2v-2ZM19 15h2v6h-6v-2M15 19h2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaymentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />

      <path
        d="M3 9h18M7 15h3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function RefundIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-7 w-7"
      aria-hidden="true"
    >
      <path
        d="M5 7v5h5M19 17v-5h-5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M7 17a7 7 0 0 0 11-3M17 7A7 7 0 0 0 6 10"
        strokeLinecap="round"
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
      className="h-7 w-7"
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
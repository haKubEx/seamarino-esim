import type { Metadata } from "next";
import Link from "next/link";

import Hero from "@/app/Components/home/Hero";
import SearchPlans from "@/app/Components/home/SearchPlans";
import PopularDestinations from "@/app/Components/home/PopularDestinations";
import FeaturedPlans from "@/app/Components/home/FeaturedPlans";
import WhyChooseUs from "@/app/Components/home/WhyChooseUs";
import HowItWorks from "@/app/Components/home/HowItWorks";

export const metadata: Metadata = {
  title: "Seamarino eSIM | Affordable Global eSIM Plans",
  description:
    "Stay connected worldwide with affordable Seamarino eSIM data plans for Filipino seafarers, travelers, OFWs, and digital nomads.",
};

const trustItems = [
  {
    title: "Instant Delivery",
    description: "Receive your eSIM details after successful payment.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Global Coverage",
    description: "Choose data packages for countries and regions worldwide.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path
          d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21M12 3C9.6 5.5 8.4 8.5 8.4 12S9.6 18.5 12 21"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Secure Checkout",
    description: "Pay safely through our protected online checkout.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path
          d="M7 10V7a5 5 0 0 1 10 0v3"
          strokeLinecap="round"
        />
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M12 14v3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Customer Support",
    description: "Get assistance before and after purchasing your eSIM.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="h-6 w-6"
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
    ),
  },
];

const testimonials = [
  {
    name: "Marco D.",
    role: "Filipino Seafarer",
    review:
      "The activation process was easy to follow, and I was able to connect after arriving at our next port.",
    initials: "MD",
  },
  {
    name: "Anne R.",
    role: "International Traveler",
    review:
      "I purchased my data plan before departure. It saved me from looking for a physical SIM after landing.",
    initials: "AR",
  },
  {
    name: "Paolo S.",
    role: "Overseas Filipino Worker",
    review:
      "The available plans were easy to compare, and customer support helped me choose the correct package.",
    initials: "PS",
  },
];

const faqs = [
  {
    question: "What is an eSIM?",
    answer:
      "An eSIM is a digital SIM that lets compatible phones connect to a mobile network without inserting a physical SIM card.",
  },
  {
    question: "When should I install my eSIM?",
    answer:
      "You can install it before traveling while you have stable internet. Activate the data plan according to the instructions for your selected package.",
  },
  {
    question: "Can I keep my physical SIM active?",
    answer:
      "Most compatible dual-SIM phones allow you to keep your regular SIM for calls and messages while using the eSIM for mobile data.",
  },
  {
    question: "How will I receive my eSIM?",
    answer:
      "Your eSIM installation details are provided digitally after your order and payment are successfully processed.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-white">
      <Hero />

      <section className="relative z-10">
        <SearchPlans />
      </section>

      <TrustSection />

      <PopularDestinations />

      <FeaturedPlans />

      <WhyChooseUs />

      <HowItWorks />

      <TestimonialsSection />

      <FaqPreview />

      <FinalCallToAction />
    </main>
  );
}

function TrustSection() {
  return (
    <section className="border-y border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
        {trustItems.map((item) => (
          <article
            key={item.title}
            className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#0A2D62]">
              {item.icon}
            </div>

            <div>
              <h2 className="font-bold text-slate-900">
                {item.title}
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                {item.description}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-600">
            Customer experiences
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Built for people who need to stay connected
          </h2>

          <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
            Whether you are working at sea, traveling abroad, or
            visiting family, Seamarino helps make mobile data easier
            to access.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.name}
              className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className="flex gap-1 text-amber-500"
                aria-label="Five-star rating"
              >
                {Array.from({ length: 5 }).map((_, index) => (
                  <svg
                    key={index}
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                    aria-hidden="true"
                  >
                    <path d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.32l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5Z" />
                  </svg>
                ))}
              </div>

              <blockquote className="mt-6 text-base leading-7 text-slate-700">
                “{testimonial.review}”
              </blockquote>

              <div className="mt-7 flex items-center gap-4 border-t border-slate-100 pt-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0A2D62] text-sm font-black text-white">
                  {testimonial.initials}
                </div>

                <div>
                  <p className="font-bold text-slate-900">
                    {testimonial.name}
                  </p>

                  <p className="text-sm text-slate-500">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqPreview() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-600">
            Frequently asked questions
          </p>

          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Everything you need to get started
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            Learn the basics before purchasing and installing your
            Seamarino eSIM.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.question}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm open:border-blue-200 open:bg-blue-50/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 font-bold text-slate-900">
                <span>{faq.question}</span>

                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-[#0A2D62] transition group-open:rotate-45 group-open:bg-white">
                  +
                </span>
              </summary>

              <p className="mt-4 max-w-3xl pr-8 leading-7 text-slate-600">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/faq"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#0A2D62] px-6 py-3 font-bold text-[#0A2D62] transition hover:bg-[#0A2D62] hover:text-white"
          >
            View all FAQs

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

function FinalCallToAction() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#071f45] px-6 py-14 shadow-2xl sm:px-10 sm:py-16 lg:px-16">
        <div
          className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-sky-400/20 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-sky-300">
              Ready for your next journey?
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
              Connect before you arrive.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
              Browse affordable eSIM packages and prepare your mobile
              data before your next trip, deployment, or port visit.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Link
              href="/shop"
              className="inline-flex min-w-40 items-center justify-center rounded-xl bg-white px-7 py-4 font-black text-[#0A2D62] shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              Shop eSIMs
            </Link>

            <Link
              href="/contact"
              className="inline-flex min-w-40 items-center justify-center rounded-xl border border-white/40 px-7 py-4 font-bold text-white transition hover:bg-white/10"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
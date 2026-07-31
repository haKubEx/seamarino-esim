import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#071B3B] text-white">
      <div className="mx-auto max-w-7xl px-6 py-16">

        <div className="grid gap-12 lg:grid-cols-4">

          {/* Company */}

          <div>

            <div className="flex items-center gap-4">

              <img
                src="/seamarino-logo.jpg"
                alt="Seamarino eSIM"
                className="h-16 w-16 rounded-full border-2 border-blue-400 object-cover"
              />

              <div>

                <h2 className="text-3xl font-black">
                  Seamarino
                </h2>

                <p className="text-lg font-semibold text-sky-400">
                  eSIM
                </p>

              </div>

            </div>

            <p className="mt-6 leading-8 text-slate-300">
              Affordable eSIM data plans built for
              seafarers, travelers, OFWs and digital
              nomads. Stay connected anywhere with
              instant activation and reliable coverage.
            </p>

            <div className="mt-6 flex gap-3">

              <span className="rounded-full bg-blue-900 px-4 py-2 text-sm font-semibold">
                🌍 200+ Countries
              </span>

              <span className="rounded-full bg-blue-900 px-4 py-2 text-sm font-semibold">
                ⚡ Instant Delivery
              </span>

            </div>

          </div>

          {/* Quick Links */}

          <div>

            <h3 className="mb-6 text-xl font-bold">
              Quick Links
            </h3>

            <ul className="space-y-4">

              <li>
                <Link
                  href="/"
                  className="text-slate-300 transition hover:text-white"
                >
                  Home
                </Link>
              </li>

              <li>
                <Link
                  href="/shop"
                  className="text-slate-300 transition hover:text-white"
                >
                  Shop eSIM Plans
                </Link>
              </li>

              <li>
                <Link
                  href="/coverage"
                  className="text-slate-300 transition hover:text-white"
                >
                  Coverage
                </Link>
              </li>

              <li>
                <Link
                  href="/faq"
                  className="text-slate-300 transition hover:text-white"
                >
                  FAQ
                </Link>
              </li>

              <li>
                <Link
                  href="/contact"
                  className="text-slate-300 transition hover:text-white"
                >
                  Contact
                </Link>
              </li>

            </ul>

          </div>

          {/* Support */}

          <div>

            <h3 className="mb-6 text-xl font-bold">
              Customer Support
            </h3>

            <ul className="space-y-4 text-slate-300">

              <li>📱 Installation Guide</li>

              <li>📦 Refund Policy</li>

              <li>🔒 Privacy Policy</li>

              <li>📃 Terms & Conditions</li>

              <li>💬 24/7 Customer Support</li>

            </ul>

          </div>

          {/* Contact */}

          <div>

            <h3 className="mb-6 text-xl font-bold">
              Contact Us
            </h3>

            <div className="space-y-5 text-slate-300">

              <div>

                <p className="font-semibold text-white">
                  Facebook
                </p>

                <a
                  href="https://facebook.com/seamarinoesim"
                  target="_blank"
                  className="transition hover:text-sky-400"
                >
                  Seamarino eSIM
                </a>

              </div>

              <div>

                <p className="font-semibold text-white">
                  Email
                </p>

                <p>
                  support@seamarinoesim.com
                </p>

              </div>

              <div>

                <p className="font-semibold text-white">
                  Availability
                </p>

                <p>
                  24 Hours Customer Support
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* Bottom */}

        <div className="mt-14 border-t border-slate-700 pt-8">

          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">

            <p className="text-center text-slate-400 lg:text-left">
              © 2026 Seamarino eSIM. All Rights Reserved.
            </p>

            <div className="flex flex-wrap justify-center gap-3">

              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm">
                🔒 Secure Checkout
              </span>

              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm">
                🌍 Global Coverage
              </span>

              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm">
                ⚡ Instant Activation
              </span>

              <span className="rounded-full bg-slate-800 px-4 py-2 text-sm">
                💬 24/7 Support
              </span>

            </div>

          </div>

        </div>

      </div>
    </footer>
  );
}
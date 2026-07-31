import Link from "next/link";

interface SuccessPageProps {
  searchParams: Promise<{
    reference?: string;
  }>;
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className="h-10 w-10"
      aria-hidden="true"
    >
      <path
        d="m5 12 4 4L19 6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
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

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z"
        strokeLinejoin="round"
      />

      <path
        d="m8.5 12 2.2 2.2 4.8-5"
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
      className="h-6 w-6"
      aria-hidden="true"
    >
      <rect x="7" y="2" width="10" height="20" rx="2" />

      <path
        d="M10 5h4M11 18h2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const { reference } = await searchParams;

  const safeReference = reference?.trim();

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50">
      <div
        className="absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[80vh] max-w-5xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <section className="w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
          <div className="bg-gradient-to-br from-[#071f45] via-[#0A2D62] to-blue-700 px-6 py-12 text-center text-white sm:px-10 sm:py-16">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-white/15 bg-emerald-400 text-white shadow-xl">
              <CheckIcon />
            </div>

            <p className="mt-7 text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
              Payment submitted
            </p>

            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
              Thank you for your order
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
              Your payment details were submitted successfully. We are
              verifying the transaction before processing and delivering
              your eSIM.
            </p>
          </div>

          <div className="p-6 sm:p-10 lg:p-12">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 shadow-sm">
                    <ShieldIcon />
                  </div>

                  <div>
                    <h2 className="font-black text-amber-950">
                      Payment verification in progress
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-amber-800">
                      This page confirms that you returned from the payment
                      page. Your eSIM will only be issued after the payment is
                      confirmed by our system.
                    </p>
                  </div>
                </div>
              </div>

              {safeReference && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Order reference
                  </p>

                  <p className="mt-3 break-all font-mono text-base font-black text-slate-950 sm:text-lg">
                    {safeReference}
                  </p>

                  <p className="mt-2 text-sm text-slate-500">
                    Keep this reference for payment and support inquiries.
                  </p>
                </div>
              )}

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <ShieldIcon />
                  </div>

                  <h3 className="mt-4 font-black text-slate-950">
                    Verification
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your payment status is checked securely.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <MailIcon />
                  </div>

                  <h3 className="mt-4 font-black text-slate-950">
                    Email delivery
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Your eSIM details will be sent to your checkout email.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                    <PhoneIcon />
                  </div>

                  <h3 className="mt-4 font-black text-slate-950">
                    Installation
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Follow the installation guide included with your eSIM.
                  </p>
                </div>
              </div>

              <div className="mt-8 rounded-2xl bg-blue-50 p-5 sm:p-6">
                <h2 className="text-lg font-black text-slate-950">
                  What happens next?
                </h2>

                <ol className="mt-5 space-y-4">
                  <li className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A2D62] text-sm font-black text-white">
                      1
                    </span>

                    <div>
                      <p className="font-bold text-slate-900">
                        We confirm your payment
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        The transaction is verified through our payment
                        provider.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A2D62] text-sm font-black text-white">
                      2
                    </span>

                    <div>
                      <p className="font-bold text-slate-900">
                        We process your eSIM
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Your selected package is ordered after successful
                        verification.
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0A2D62] text-sm font-black text-white">
                      3
                    </span>

                    <div>
                      <p className="font-bold text-slate-900">
                        You receive your eSIM
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Your QR code and installation details are sent to your
                        email.
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/shop"
                  className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-[#0A2D62] to-blue-700 px-8 py-4 font-black text-white shadow-lg shadow-blue-950/15 transition hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-600 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-100"
                >
                  Continue Shopping
                </Link>

                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-2xl border-2 border-slate-200 bg-white px-8 py-4 font-black text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                >
                  Return Home
                </Link>
              </div>

              <p className="mt-7 text-center text-sm leading-6 text-slate-500">
                Do not purchase the same plan again while your payment is
                being verified.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
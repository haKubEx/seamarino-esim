import "server-only";

import { Resend } from "resend";

type SendEsimEmailInput = {
  customerName: string;
  customerEmail: string;
  referenceNumber: string;
  planName: string;
  iccid: string;
  activationCode: string;
  qrCodeUrl: string;
  apn?: string | null;
};

export type SendEsimEmailResult = {
  emailId: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getEmailConfig() {
  const apiKey =
    process.env.RESEND_API_KEY?.trim();

  const from =
    process.env.EMAIL_FROM?.trim();

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is missing from the environment.",
    );
  }

  if (!from) {
    throw new Error(
      "EMAIL_FROM is missing from the environment.",
    );
  }

  return {
    apiKey,
    from,
  };
}

function createEmailHtml(
  input: SendEsimEmailInput,
) {
  const customerName =
    escapeHtml(input.customerName);

  const referenceNumber =
    escapeHtml(input.referenceNumber);

  const planName =
    escapeHtml(input.planName);

  const iccid =
    escapeHtml(input.iccid);

  const activationCode =
    escapeHtml(input.activationCode);

  const qrCodeUrl =
    escapeHtml(input.qrCodeUrl);

  const apn =
    input.apn?.trim()
      ? escapeHtml(input.apn.trim())
      : "Automatic";

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>Your Seamarino eSIM</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #f1f5f9;
          font-family: Arial, Helvetica, sans-serif;
          color: #0f172a;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          border="0"
        >
          <tr>
            <td
              align="center"
              style="padding: 32px 16px"
            >
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  max-width: 640px;
                  overflow: hidden;
                  border-radius: 24px;
                  background: #ffffff;
                  box-shadow: 0 12px 35px rgba(15, 23, 42, 0.12);
                "
              >
                <tr>
                  <td
                    style="
                      padding: 36px 30px;
                      background: #0a2d62;
                      color: #ffffff;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #7dd3fc;
                        font-size: 13px;
                        font-weight: 700;
                        letter-spacing: 2px;
                        text-transform: uppercase;
                      "
                    >
                      Seamarino eSIM
                    </p>

                    <h1
                      style="
                        margin: 14px 0 0;
                        font-size: 32px;
                        line-height: 1.25;
                      "
                    >
                      Your eSIM is ready
                    </h1>

                    <p
                      style="
                        margin: 14px 0 0;
                        color: #dbeafe;
                        font-size: 16px;
                        line-height: 1.7;
                      "
                    >
                      Scan the QR code below to install
                      your mobile data plan.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px">
                    <p
                      style="
                        margin: 0;
                        font-size: 17px;
                        line-height: 1.7;
                      "
                    >
                      Hello
                      <strong>${customerName}</strong>,
                    </p>

                    <p
                      style="
                        margin: 14px 0 0;
                        color: #475569;
                        font-size: 15px;
                        line-height: 1.7;
                      "
                    >
                      Your payment was confirmed and
                      your Seamarino eSIM profile has
                      been issued.
                    </p>

                    <div
                      style="
                        margin-top: 24px;
                        border-radius: 16px;
                        background: #eff6ff;
                        padding: 20px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #1d4ed8;
                          font-size: 12px;
                          font-weight: 700;
                          text-transform: uppercase;
                          letter-spacing: 1.4px;
                        "
                      >
                        Order details
                      </p>

                      <p
                        style="
                          margin: 12px 0 0;
                          font-size: 17px;
                          font-weight: 700;
                        "
                      >
                        ${planName}
                      </p>

                      <p
                        style="
                          margin: 8px 0 0;
                          color: #475569;
                          font-size: 14px;
                        "
                      >
                        Reference:
                        ${referenceNumber}
                      </p>
                    </div>

                    <div
                      style="
                        margin-top: 28px;
                        text-align: center;
                      "
                    >
                      <img
                        src="${qrCodeUrl}"
                        alt="Seamarino eSIM QR code"
                        width="260"
                        height="260"
                        style="
                          display: block;
                          width: 260px;
                          height: 260px;
                          max-width: 100%;
                          margin: 0 auto;
                          border: 12px solid #ffffff;
                          border-radius: 20px;
                          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
                        "
                      />

                      <p
                        style="
                          margin: 18px 0 0;
                          color: #64748b;
                          font-size: 13px;
                          line-height: 1.6;
                        "
                      >
                        Open this email on another
                        device while scanning the QR
                        code with your phone.
                      </p>
                    </div>

                    <div
                      style="
                        margin-top: 28px;
                        border: 1px solid #e2e8f0;
                        border-radius: 16px;
                        padding: 22px;
                      "
                    >
                      <h2
                        style="
                          margin: 0;
                          color: #0a2d62;
                          font-size: 20px;
                        "
                      >
                        Manual installation details
                      </h2>

                      <p
                        style="
                          margin: 18px 0 6px;
                          color: #64748b;
                          font-size: 12px;
                          font-weight: 700;
                          text-transform: uppercase;
                        "
                      >
                        Activation code
                      </p>

                      <p
                        style="
                          margin: 0;
                          overflow-wrap: anywhere;
                          border-radius: 10px;
                          background: #f8fafc;
                          padding: 12px;
                          font-family: monospace;
                          font-size: 13px;
                          line-height: 1.6;
                        "
                      >
                        ${activationCode}
                      </p>

                      <p
                        style="
                          margin: 18px 0 6px;
                          color: #64748b;
                          font-size: 12px;
                          font-weight: 700;
                          text-transform: uppercase;
                        "
                      >
                        ICCID
                      </p>

                      <p
                        style="
                          margin: 0;
                          font-family: monospace;
                          font-size: 14px;
                        "
                      >
                        ${iccid}
                      </p>

                      <p
                        style="
                          margin: 18px 0 6px;
                          color: #64748b;
                          font-size: 12px;
                          font-weight: 700;
                          text-transform: uppercase;
                        "
                      >
                        APN
                      </p>

                      <p
                        style="
                          margin: 0;
                          font-family: monospace;
                          font-size: 14px;
                        "
                      >
                        ${apn}
                      </p>
                    </div>

                    <div
                      style="
                        margin-top: 28px;
                        border-radius: 16px;
                        background: #fffbeb;
                        padding: 20px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #92400e;
                          font-size: 16px;
                          font-weight: 700;
                        "
                      >
                        Important reminders
                      </p>

                      <ol
                        style="
                          margin: 14px 0 0;
                          padding-left: 20px;
                          color: #78350f;
                          font-size: 14px;
                          line-height: 1.8;
                        "
                      >
                        <li>
                          Install while connected to
                          stable Wi-Fi.
                        </li>
                        <li>
                          Do not delete the eSIM after
                          installation.
                        </li>
                        <li>
                          Enable data roaming on the
                          eSIM line.
                        </li>
                        <li>
                          Select the eSIM as your
                          mobile-data line.
                        </li>
                      </ol>
                    </div>

                    <div
                      style="
                        margin-top: 30px;
                        text-align: center;
                      "
                    >
                      <a
                        href="https://www.seamarinoesim.com/contact"
                        style="
                          display: inline-block;
                          border-radius: 14px;
                          background: #0a2d62;
                          padding: 14px 24px;
                          color: #ffffff;
                          font-size: 15px;
                          font-weight: 700;
                          text-decoration: none;
                        "
                      >
                        Contact Support
                      </a>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 24px 30px;
                      background: #071f45;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #bfdbfe;
                        font-size: 13px;
                        line-height: 1.7;
                      "
                    >
                      Keep this email private. It
                      contains your personal eSIM
                      installation credentials.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendEsimDeliveryEmail(
  input: SendEsimEmailInput,
): Promise<SendEsimEmailResult> {
  const {
    apiKey,
    from,
  } = getEmailConfig();

  const resend = new Resend(apiKey);

  const response =
    await resend.emails.send({
      from,
      to: [input.customerEmail],
      subject:
        `Your Seamarino eSIM is ready — ${input.referenceNumber}`,
      html: createEmailHtml(input),
    });

  if (response.error) {
    console.error(
      "RESEND EMAIL ERROR:",
      response.error,
    );

    throw new Error(
      response.error.message ||
        "Resend could not deliver the eSIM email.",
    );
  }

  const emailId =
    response.data?.id;

  if (!emailId) {
    throw new Error(
      "Resend accepted the email but did not return an email ID.",
    );
  }

  console.info(
    "ESIM DELIVERY EMAIL SENT:",
    {
      emailId,
      referenceNumber:
        input.referenceNumber,
      customerEmail:
        input.customerEmail,
    },
  );

  return {
    emailId,
  };
}
import { Resend } from "resend";

type SendPasswordResetEmailInput = {
  customerName: string;
  customerEmail: string;
  resetUrl: string;
};

function getEmailConfiguration() {
  const apiKey =
    process.env.RESEND_API_KEY?.trim();

  const from =
    process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not configured.",
    );
  }

  if (!from) {
    throw new Error(
      "RESEND_FROM_EMAIL is not configured.",
    );
  }

  return {
    apiKey,
    from,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createPasswordResetEmailHtml(
  input: SendPasswordResetEmailInput,
) {
  const customerName =
    escapeHtml(
      input.customerName ||
        "Customer",
    );

  const resetUrl =
    escapeHtml(input.resetUrl);

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <title>Reset your Seamarino password</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background: #f1f5f9;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellspacing="0"
          cellpadding="0"
          style="
            width: 100%;
            background: #f1f5f9;
            padding: 40px 16px;
          "
        >
          <tr>
            <td align="center">
              <table
                role="presentation"
                width="100%"
                cellspacing="0"
                cellpadding="0"
                style="
                  max-width: 620px;
                  overflow: hidden;
                  border-radius: 24px;
                  background: #ffffff;
                  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.1);
                "
              >
                <tr>
                  <td
                    style="
                      padding: 42px 32px;
                      background: linear-gradient(
                        135deg,
                        #071f45,
                        #0a2d62,
                        #1d4ed8
                      );
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #93c5fd;
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
                        color: #ffffff;
                        font-size: 32px;
                        line-height: 1.25;
                      "
                    >
                      Reset your password
                    </h1>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 36px 32px">
                    <p
                      style="
                        margin: 0;
                        color: #0f172a;
                        font-size: 18px;
                        font-weight: 700;
                      "
                    >
                      Hello ${customerName},
                    </p>

                    <p
                      style="
                        margin: 18px 0 0;
                        color: #475569;
                        font-size: 15px;
                        line-height: 1.8;
                      "
                    >
                      We received a request to reset the
                      password for your Seamarino eSIM account.
                    </p>

                    <p
                      style="
                        margin: 14px 0 0;
                        color: #475569;
                        font-size: 15px;
                        line-height: 1.8;
                      "
                    >
                      Click the button below to choose a new
                      password. This link expires in 30 minutes
                      and can only be used once.
                    </p>

                    <div
                      style="
                        margin-top: 30px;
                        text-align: center;
                      "
                    >
                      <a
                        href="${resetUrl}"
                        style="
                          display: inline-block;
                          border-radius: 14px;
                          background: #0a2d62;
                          padding: 15px 28px;
                          color: #ffffff;
                          font-size: 15px;
                          font-weight: 700;
                          text-decoration: none;
                        "
                      >
                        Reset Password
                      </a>
                    </div>

                    <div
                      style="
                        margin-top: 28px;
                        border-radius: 14px;
                        background: #f8fafc;
                        padding: 18px;
                      "
                    >
                      <p
                        style="
                          margin: 0;
                          color: #64748b;
                          font-size: 13px;
                          line-height: 1.7;
                          word-break: break-all;
                        "
                      >
                        If the button does not work, copy this
                        link into your browser:
                        <br />
                        ${resetUrl}
                      </p>
                    </div>

                    <p
                      style="
                        margin: 26px 0 0;
                        color: #64748b;
                        font-size: 14px;
                        line-height: 1.7;
                      "
                    >
                      If you did not request a password reset,
                      you can safely ignore this email. Your
                      password will remain unchanged.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td
                    style="
                      padding: 22px 30px;
                      background: #071f45;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        color: #bfdbfe;
                        font-size: 12px;
                        line-height: 1.7;
                      "
                    >
                      Never share your password or reset link
                      with anyone.
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

export async function sendPasswordResetEmail(
  input: SendPasswordResetEmailInput,
) {
  const {
    apiKey,
    from,
  } = getEmailConfiguration();

  const resend =
    new Resend(apiKey);

  const result =
    await resend.emails.send({
      from,
      to: [
        input.customerEmail,
      ],
      subject:
        "Reset your Seamarino eSIM password",
      html:
        createPasswordResetEmailHtml(
          input,
        ),
    });

  if (result.error) {
    console.error(
      "PASSWORD RESET EMAIL ERROR:",
      result.error,
    );

    throw new Error(
      result.error.message ||
        "Unable to send the password reset email.",
    );
  }

  if (!result.data?.id) {
    throw new Error(
      "Resend did not return an email ID.",
    );
  }

  return {
    emailId:
      result.data.id,
  };
}
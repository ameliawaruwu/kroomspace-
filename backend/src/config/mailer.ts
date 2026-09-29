import nodemailer, { Transporter } from "nodemailer";

export let transporter: Transporter;

export const getEmailFrom = () => {
  const name = (process.env.MAIL_FROM_NAME || "KroomSpace Apps").replace(/"/g, '');
  const addr = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_USERNAME || process.env.EMAIL_USER || "kroomspace@gmail.com";
  return `"${name}" <${addr}>`;
};

export async function initMail() {
  const mailUser = process.env.MAIL_USERNAME || process.env.EMAIL_USER;
  const mailPass = process.env.MAIL_PASSWORD || process.env.EMAIL_PASS;
  const mailHost = process.env.MAIL_HOST || "smtp.gmail.com";
  const mailPort = Number(process.env.MAIL_PORT) || 587;

  if (mailUser && mailPass) {
    transporter = nodemailer.createTransport({
      host: mailHost,
      port: mailPort,
      secure: mailPort === 465,
      auth: {
        user: mailUser,
        pass: mailPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    console.log(`[Nodemailer] SMTP Configured (${mailHost}:${mailPort}) for user: ${mailUser}`);
  } else {
    let testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log("[Nodemailer] Ethereal email test account created.");
  }
}

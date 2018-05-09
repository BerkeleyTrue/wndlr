// @flow
import type { TransportSettings } from 'nodemailer';
import isDev from 'isdev';

export const db = {
  url: process.env.DB_URL,
  name: process.env.DB_NAME,
  auth: {
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
  },
};

type EmailConfig = {
  defaultSender: string,
  transport: TransportSettings,
  transports?: TransportSettings[],
};
export const email: EmailConfig = {
  defaultSender: process.env.EMAIL_SENDER || '',
  transport: {
    type: 'smtp',
    alias: 'gmail',
    host: 'smpt.gmail.com',
    port: 465,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  },
};

const dn = 'WNDLR';
// these are added to express app
export const general = {
  // auto disable x-powered-by header
  'x-powered-by': false,
  ns: 'wndlr',
  'state namespace': '__wndlr__',
  defaultSender: email.defaultSender,
  dn,
  proxyPort: isDev ? process.env.PROXY_PORT : undefined,
  port: process.env.PORT,
  protocol: isDev ? 'http' : 'https',
  host: isDev ? 'localhost' : dn,
  tld: '.com',
  url: '',
};

general.url =
  general.protocol +
  general.host +
  (general.proxyPort ? ':' + general.proxyPort : '');

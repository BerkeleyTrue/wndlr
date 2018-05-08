// @flow
declare module 'nodemailer' {
  declare type EmailOrEmails = string | string[]
  declare type EmailContent = string | Buffer | ReadableStream | {
    path: string,
  }

  declare type SendData = {
    from: string,
    to: EmailOrEmails,
    cc?: EmailOrEmails,
    bcc?: EmailOrEmails,
    subject: string,
    text?: EmailContent,
    html?: EmailContent,
  }

  declare type TransportSettings = {
    type: string,
    alias?: string,
    host: string,
    port: number,
    auth: {
      user: ?string,
      pass: ?string,
    }
  }

  declare type SendInfo = {
    messageId: string,
    envelope: any,
    accepted: Array<any>,
    rejected: Array<any>,
    pending: Array<any>,
    response: string,
  };

  declare type Transport = {
    sendMail(SendData): Promise<SendInfo>,
    sendMail(
      SendData,
      (Error, SendInfo) => any
    ): void
  }

  declare module.exports: {
    createTransport(TransportSettings | void): Transport
  }
}

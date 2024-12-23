import { Injectable } from '@nestjs/common';
import { createTransport, TransportOptions } from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const EMAIL_USER_DEFAULT = process.env.EMAIL_USER_DEFAULT;

@Injectable()
export class MailService {
  private readonly nodemailerTransport: any;

  constructor() {
    this.nodemailerTransport = createTransport({
      service: 'gmail',
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASSWORD,
      },
    } as TransportOptions);
  }

  public async sendFileLinkMail(email: string, link: string): Promise<void> {
    await this.nodemailerTransport.sendMail({
      from: EMAIL_USER_DEFAULT,
      to: email,
      date: new Date(),
      subject: 'File sharing link',
      html: `<p>A file has been shared with you.</p></br><p>Access it using the following link:</p><a href="${link}">${link}</a>`,
    });
  }
}

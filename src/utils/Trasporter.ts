import nodemailer from 'nodemailer';
import SG_transport from 'nodemailer-sendgrid-transport';

export const transporter = nodemailer.createTransport(
  SG_transport({
    auth: {
      api_key: process.env.SENDGRID_API,
    },
  }),
);

import * as React from "react";

import * as ReactDOMServer from "react-dom/server";

import * as Mails from "./templates";
import type { MailType } from "./templates";

export interface MailConfig<T extends MailType = MailType> {
  template: T;
  props?: T extends "ConfirmRegistration"
    ? { userName: string; verificationCode: string }
    : T extends "AnonymizationRequested"
      ? { userName: string; undoCode: string }
      : T extends "AnonymizationUndone"
        ? { userName: string }
        : T extends "ContactInquiry"
          ? {
              email: string;
              subject: string;
              message: string;
              inquiryType: string;
            }
          : T extends "AccountDeletionRequested"
            ? { userName: string; undoCode: string }
            : Record<string, any>;
}

export interface RenderedMail<T extends MailType = MailType> {
  html: string;
  props: any;
  template: T;
  changeProps(newProps: any): string;
  getProps(): any;
}

export class MailProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  static generatePreviews(): string {
    const previews = [
      {
        name: "ConfirmRegistration",
        description: "Email sent after user registration",
        component: React.createElement(Mails.ConfirmRegistration, {
          userName: "Jan Kowalski",
          verificationCode: "123456",
        }),
      },
    ];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Email Previews</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .preview { margin-bottom: 40px; border: 1px solid #ccc; padding: 20px; }
            .preview h2 { margin-top: 0; }
          </style>
        </head>
        <body>
          <h1>Email Previews</h1>
          ${previews
            .map(
              (preview) => `
            <div class="preview">
              <h2>${preview.name}</h2>
              <p>${preview.description}</p>
              <div style="border: 1px solid #ddd; padding: 20px; background: #f9f9f9;">
                ${ReactDOMServer.renderToString(preview.component)}
              </div>
            </div>
          `,
            )
            .join("")}
        </body>
      </html>
    `;
  }

  async generateMail<T extends MailType>(config: MailConfig<T>): Promise<RenderedMail<T>> {
    const { template, props = {} } = config;

    // Inline styles implementation
    const TemplateComponent = Mails[template] as any;
    if (!TemplateComponent) {
      throw new Error(`Email template '${template}' not found`);
    }

    const emailComponent = React.createElement(TemplateComponent, props as any);

    return {
      html: ReactDOMServer.renderToString(emailComponent),
      props: { ...props } as any,
      template,

      changeProps: (newProps: any) => {
        const mergedProps = { ...props, ...newProps };
        const updatedComponent = React.createElement(TemplateComponent, mergedProps as any);
        return ReactDOMServer.renderToString(updatedComponent);
      },

      getProps: () => ({ ...props }) as any,
    };
  }

  async sendEmailDirectly(emailParams: {
    to: { email: string; name?: string }[];
    subject: string;
    html: string;
  }): Promise<void> {
    const response = await fetch("https://api.mailersend.com/v1/email", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        from: { email: "noreply@crosspad.app", name: "Crosspad.app" },
        to: emailParams.to,
        subject: emailParams.subject,
        html: emailParams.html,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`MailerSend API error: ${response.status} ${error}`);
    }
  }

  async generateAndSend<T extends MailType>(
    config: MailConfig<T>,
    recipientEmail: string,
    subject: string,
  ): Promise<void> {
    const mailContent = await this.generateMail(config);

    await this.sendEmailDirectly({
      to: [{ email: recipientEmail }],
      subject,
      html: mailContent.html,
    });
  }
}

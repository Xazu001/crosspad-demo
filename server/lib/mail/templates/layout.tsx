/** @jsxImportSource react */
import { SITE_URL } from "@/constants";
import { Body, Column, Font, Head, Html, Img, Link, Section, Text } from "@react-email/components";

import * as React from "react";

import { styles, vars } from "./styles";

export { vars };

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <Html>
      <Head>
        <Font fontFamily="Arial" fallbackFontFamily="sans-serif" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Message from Crosspad.app</title>
      </Head>
      <Body style={{ backgroundColor: vars.colors.background, padding: "20px 0" }}>
        <Section style={{ maxWidth: "456px", margin: "0 auto" }}>
          <Column
            style={{
              backgroundColor: vars.colors.container,
              borderRadius: vars.borderRadius,
              padding: "0",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              overflow: "hidden",
            }}
          >
            {/* Banner */}
            <div style={{ padding: vars.spacing.large }}>
              <Img
                src={`${SITE_URL}/assets/mail/banner.png`}
                alt="Crosspad.app"
                style={styles.image}
              />
            </div>

            {/* Content */}
            <div
              style={{
                padding: `0 ${vars.spacing.large} ${vars.spacing.large} ${vars.spacing.large}`,
              }}
            >
              {children}
            </div>

            {/* Footer */}
            <div style={{ padding: `0 ${vars.spacing.large}` }}>
              <Text style={styles.footer}>
                Best Regards <br />
                Crosspad.app Team
              </Text>

              <Img src={`${SITE_URL}/assets/mail/footer.png`} alt="" style={styles.image} />

              <div
                style={{
                  textAlign: "center",
                  padding: `16px ${vars.spacing.large} ${vars.spacing.large} ${vars.spacing.large}`,
                }}
              >
                <Link href={`${SITE_URL}/legal/terms`} style={styles.footerLink}>
                  Terms Of Service
                </Link>
                <span style={styles.divider}></span>
                <Link href={`${SITE_URL}/contact`} style={styles.footerLink}>
                  Contact Us
                </Link>
              </div>

              <div
                style={{
                  textAlign: "center",
                  padding: `${vars.spacing.medium} ${vars.spacing.large} ${vars.spacing.large} ${vars.spacing.large}`,
                }}
              >
                <Link href={`${SITE_URL}`} style={styles.brandLink}>
                  Crosspad.app
                </Link>
              </div>
            </div>
          </Column>
        </Section>
      </Body>
    </Html>
  );
}

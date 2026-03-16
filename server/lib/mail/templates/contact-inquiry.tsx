/** @jsxImportSource react */
import { Text } from "@react-email/components";

import { MainLayout } from "./layout";
import { styles } from "./styles";

export function ContactInquiry({
  email,
  subject,
  message,
  inquiryType,
}: {
  email: string;
  subject: string;
  message: string;
  inquiryType: string;
}) {
  return (
    <MainLayout>
      <Text style={styles.title}>New Contact Form Submission</Text>
      <Text style={styles.body}>
        <strong>Type:</strong> {inquiryType}
        <br />
        <strong>From:</strong> {email}
        <br />
        <strong>Subject:</strong> {subject}
        <br />
        <br />
        <strong>Message:</strong>
        <br />
        {message}
      </Text>
    </MainLayout>
  );
}

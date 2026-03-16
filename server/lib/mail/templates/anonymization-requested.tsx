/** @jsxImportSource react */
import { SITE_URL } from "@/constants";
import { Link, Text } from "@react-email/components";

import { MainLayout } from "./layout";
import { styles } from "./styles";

export function AnonymizationRequested({
  userName,
  undoCode,
}: {
  userName: string;
  undoCode: string;
}) {
  return (
    <MainLayout>
      <Text style={styles.title}>Account Deletion Request Received</Text>
      <Text style={styles.body}>
        Hello {userName},
        <br />
        <br />
        We have received your request to delete your account. Your account will be anonymized in{" "}
        <strong>24 days</strong>.
        <br />
        <br />
        During this grace period, you can undo this action by clicking the link below:
        <br />
        <br />
        <Link href={`${SITE_URL}/api/user/anonymize-undo/${undoCode}`}>Undo Account Deletion</Link>
        <br />
        <br />
        <strong>Your Deletion Code:</strong>
        <br />
        <code style={{ fontSize: "16px", fontFamily: "monospace" }}>{undoCode}</code>
        <br />
        <br />
        This code is required if you wish to request a <strong>complete deletion</strong> of your
        account through our contact form.
        <br />
        <br />
        After the 24-day period, your account data will be permanently anonymized and cannot be
        recovered.
      </Text>
    </MainLayout>
  );
}

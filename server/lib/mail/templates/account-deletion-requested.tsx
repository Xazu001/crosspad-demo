/** @jsxImportSource react */
import { SITE_URL } from "@/constants";
import { Link, Text } from "@react-email/components";

import { MainLayout } from "./layout";
import { styles } from "./styles";

export function AccountDeletionRequested({
  userName,
  undoCode,
}: {
  userName: string;
  undoCode: string;
}) {
  return (
    <MainLayout>
      <Text style={styles.title}>Full Account Deletion Request Received</Text>
      <Text style={styles.body}>
        Hello {userName},
        <br />
        <br />
        We have received your request for <strong>full account deletion</strong>
        . This means your account and all associated resources (kits, sounds, and other uploaded
        content) will be permanently removed.
        <br />
        <br />
        <strong>Your Deletion Code:</strong> {undoCode}
        <br />
        <br />
        Your account will be fully deleted in <strong>30 days</strong>. During this grace period,
        you can undo this action by clicking the link below:
        <br />
        <br />
        <Link href={`${SITE_URL}/api/user/deletion-undo/${undoCode}`}>Undo Account Deletion</Link>
        <br />
        <br />
        After the 30-day period, your account and all data will be permanently deleted and cannot be
        recovered.
        <br />
        <br />
        If you did not request this deletion, please contact our support team immediately.
      </Text>
    </MainLayout>
  );
}

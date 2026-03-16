/** @jsxImportSource react */
import { Text } from "@react-email/components";

import { MainLayout } from "./layout";
import { styles } from "./styles";

export function AnonymizationUndone({ userName }: { userName: string }) {
  return (
    <MainLayout>
      <Text style={styles.title}>Account Deletion Cancelled</Text>
      <Text style={styles.body}>
        Hello {userName},
        <br />
        <br />
        Your account deletion request has been cancelled. Your account is now active again.
        <br />
        <br />
        If you did not request this cancellation, please contact our support team immediately.
      </Text>
    </MainLayout>
  );
}

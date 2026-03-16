/** @jsxImportSource react */
import { SITE_URL } from "@/constants";
import { Link, Text } from "@react-email/components";

import { MainLayout } from "./layout";
import { styles } from "./styles";

export function ConfirmRegistration({
  userName,
  verificationCode,
}: {
  userName: string;
  verificationCode: string;
}) {
  return (
    <MainLayout>
      <Text style={styles.title}>You're welcome {userName}!</Text>
      <Text style={styles.body}>
        Thank you for registering with us! <br /> To confirm registration and proceed you need to
        accept this!
        <br />
        <br />
        <Link href={`${SITE_URL}/api/auth/confirm/${verificationCode}`}>Click here to verify</Link>
      </Text>
    </MainLayout>
  );
}

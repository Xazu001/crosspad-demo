import { useNavigate } from "react-router";

import { PreviewKit } from "../play.$id";

// ──────────────────────────────────────────────────────────────

/** Kit preview page */
export default function Preview() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return <PreviewKit onBack={handleBack} />;
}

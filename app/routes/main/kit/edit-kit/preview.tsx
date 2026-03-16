import { useNavigate, useParams } from "react-router";

import { EditPreviewKit } from "../play.$id";

// ──────────────────────────────────────────────────────────────

export default function Preview() {
  const navigate = useNavigate();
  const params = useParams();

  const handleBack = () => {
    navigate(`/kit/edit/${params.kitId}/about`);
  };

  return <EditPreviewKit onBack={handleBack} />;
}

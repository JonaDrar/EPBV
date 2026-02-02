import { Suspense } from "react";
import { ResetPasswordConfirmClient } from "./ResetPasswordConfirmClient";

export default function ResetPasswordConfirmPage() {
  return (
    <Suspense>
      <ResetPasswordConfirmClient />
    </Suspense>
  );
}

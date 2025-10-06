// /forget-password/layout.js

import { Suspense } from "react";

export const metadata = {
  title: "ร้านขายยาของแม่มด - Reset Password",
  description: "ร้านขายยาของแม่มด - Password",
};

export default function ForgetPasswordLayout({ children }) {
  return <>
    <Suspense>
      {children}
    </Suspense>
  </>;
}

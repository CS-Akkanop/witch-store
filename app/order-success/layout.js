// /product/layout.js

import { Suspense } from "react";

export const metadata = {
  title: "ร้านขายยาของแม่มด - Order Complete",
  description: "ร้านขายยาของแม่มด - Order Complete",
};

export default function ProductLayout({ children }) {
  return <>
    <Suspense>
      {children}
    </Suspense>
  </>;
}

// /product/layout.js

import { Suspense } from "react";

export const metadata = {
  title: "ร้านขายยาของแม่มด - Product",
  description: "ร้านขายยาของแม่มด - Product",
};

export default function ProductLayout({ children }) {
  return <>
    <Suspense>
      {children}
    </Suspense>
  </>;
}

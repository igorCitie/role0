"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Box, Spinner } from "@chakra-ui/react";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_SKIP_AUTH === "true") {
      setChecked(true);
      return;
    }
    const token = localStorage.getItem("token");
    if (!token || token === "undefined" || token === "null") {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return (
      <Box minH="100vh" bg="surface.bg" display="flex" alignItems="center" justifyContent="center">
        <Spinner color="brand.500" size="lg" />
      </Box>
    );
  }

  return <>{children}</>;
}

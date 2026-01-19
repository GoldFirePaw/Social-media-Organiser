import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT_PX = 900;
const mediaQuery = `(max-width: ${MOBILE_BREAKPOINT_PX}px)`;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    return window.matchMedia(mediaQuery).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const media = window.matchMedia(mediaQuery);
    const update = () => setIsMobile(media.matches);

    update();
    if (media.addEventListener) {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  return isMobile;
}

export { MOBILE_BREAKPOINT_PX };

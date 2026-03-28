import { useEffect, useState } from "react";
import Lottie from "lottie-react";
import swipeAnimation from "@assets/Swipe_left_1774711578370.json";

interface SwipeHintProps {
  scrollRef: { current: HTMLElement | null };
}

export function SwipeHint({ scrollRef }: SwipeHintProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const hide = () => setVisible(false);

    el.addEventListener("scroll", hide, { once: true });
    el.addEventListener("touchstart", hide, { once: true });

    const timer = setTimeout(hide, 3000);

    return () => {
      el.removeEventListener("scroll", hide);
      el.removeEventListener("touchstart", hide);
      clearTimeout(timer);
    };
  }, [scrollRef]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 z-10">
      <Lottie
        animationData={swipeAnimation}
        loop
        autoplay
        style={{ width: 72, height: 72 }}
      />
    </div>
  );
}

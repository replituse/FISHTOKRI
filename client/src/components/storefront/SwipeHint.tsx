import Lottie from "lottie-react";
import swipeAnimation from "@assets/Swipe_left_1774711578370.json";

export function SwipeHint() {
  return (
    <div className="pointer-events-none flex flex-row items-center justify-center mt-1 gap-0.5">
      <Lottie
        animationData={swipeAnimation}
        loop
        autoplay
        style={{ width: 40, height: 40 }}
      />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">swipe</span>
    </div>
  );
}

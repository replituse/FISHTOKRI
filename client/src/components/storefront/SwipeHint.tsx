import Lottie from "lottie-react";
import swipeAnimation from "@assets/Swipe_left_1774711578370.json";

export function SwipeHint() {
  return (
    <div className="pointer-events-none flex flex-col items-center justify-center mt-1">
      <Lottie
        animationData={swipeAnimation}
        loop
        autoplay
        style={{ width: 48, height: 48 }}
      />
      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest -mt-1">swipe</span>
    </div>
  );
}

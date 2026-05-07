import React from "react";
import { motion } from "motion/react";
import { HeroBadge } from "./HeroBadge";
import { BottomRightCorner } from "./BottomRightCorner";

export const Hero = ({
  onScrollDown,
  setTab,
  onShowSearch,
}: {
  onSelect?: (slug: string) => void;
  onScrollDown?: () => void;
  setTab?: (t: string) => void;
  onShowSearch?: () => void;
}) => {
  return (
    <div className="w-full h-[85svh] sm:h-screen flex items-center justify-center p-3 md:p-5 bg-[#111]">
      <section className="relative w-full max-w-[1536px] h-full rounded-[1.5rem] md:rounded-[3rem] overflow-hidden flex flex-col items-center bg-black/20">
        {/* VIDEO BACKGROUND */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-center z-0 scale-100 sm:scale-[1.03]"
          src="https://res.cloudinary.com/dwbbs7rho/video/upload/Animate_leaves_and_screen_slightly_202605072322_tgzphf.mp4"
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 z-[1] bg-black/55" />

        {/* CONTENT LAYER */}
        <div className="relative z-10 w-full h-full flex flex-col items-center">
          {/* TEXT BLOCK */}
          <div className="w-full flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl -mt-10">
            <HeroBadge />

            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-bold text-white mb-3 tracking-tight leading-[1.05]"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Xem Phim Không Giới Hạn
            </motion.h1>

            <motion.p
              className="text-sm sm:text-base md:text-lg text-white/70 leading-relaxed max-w-xl font-normal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Khám phá hàng nghìn bộ phim, series độc quyền và nội dung cao cấp
              — mọi lúc, mọi nơi, trên mọi thiết bị.
            </motion.p>
          </div>

          <BottomRightCorner onClick={onScrollDown} />
        </div>
      </section>
    </div>
  );
};

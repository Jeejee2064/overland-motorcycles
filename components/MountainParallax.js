"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";

export default function MountainSeparator() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });

  // Middle: apparaît progressivement derrière le front
  const yMiddle = useTransform(scrollYProgress, [0, 0.5, 1], ["80%", "40%", "0%"]);
  
  // Back: apparaît en dernier, encore plus derrière
  const yBack = useTransform(scrollYProgress, [0, 0.7, 1], ["100%", "60%", "0%"]);

  // Opacités pour l'apparition progressive
  const opacityMiddle = useTransform(scrollYProgress, [0, 0.3, 0.6], [0, 0.8, 1]);
  const opacityBack = useTransform(scrollYProgress, [0, 0.5, 0.8], [0, 0.8, 1]);

  return (
    <div ref={ref} className="relative h-[40vh] overflow-hidden">
      {/* Back mountains - apparaît en dernier */}
      <motion.div
        style={{ 
          y: yBack,
          opacity: opacityBack
        }}
        className="absolute inset-0 flex justify-center items-end"
      >
        <Image
          src="/back.svg"
          alt="Back mountains"
          width={793}
          height={151}
          className="w-full h-auto"
        />
      </motion.div>

      {/* Middle mountains - apparaît en deuxième */}
      <motion.div
        style={{ 
          y: yMiddle,
          opacity: opacityMiddle
        }}
        className="absolute inset-0 flex justify-center items-end"
      >
        <Image
          src="/middle.svg"
          alt="Middle mountains"
          width={793}
          height={151}
          className="w-full h-auto"
        />
      </motion.div>

      {/* Front mountains - fixe, ne bouge pas */}
      <div className="absolute inset-0 flex justify-center items-end">
        <Image
          src="/front.svg"
          alt="Front mountains"
          width={793}
          height={151}
          className="w-full h-auto"
        />
      </div>
    </div>
  );
}
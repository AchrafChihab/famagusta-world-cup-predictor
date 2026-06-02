import { useId } from 'react';
import { motion } from 'motion/react';

interface AcLogoProps {
  className?: string;
  size?: number | string;
  delay?: number;
}

export function AcLogo({ className = "", size = 40, delay = 0 }: AcLogoProps) {
  const gradientId = useId();

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: 'auto' }}
    >
      <svg
        viewBox="83 118 223 135"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        <motion.path
          d="M99.0,252.5 L92.0,251.5 L85.5,246.0 L83.5,235.0 L144.0,120.5 L153.0,118.5 L161.5,123.0 L179.5,158.0 L179.5,166.0 L175.5,176.0 L165.0,185.5 L151.0,161.5 L127.0,210.5 L171.0,191.5 L182.5,179.0 L188.5,162.0 L200.5,142.0 L213.0,130.5 L228.0,122.5 L246.0,118.5 L269.0,120.5 L287.0,128.5 L303.5,143.0 L305.5,156.0 L296.0,164.5 L288.0,163.5 L272.0,149.5 L256.0,144.5 L242.0,145.5 L228.0,151.5 L216.5,163.0 L204.5,191.0 L188.0,210.5 L169.0,222.5 L99.0,252.5Z M256.0,252.5 L240.0,251.5 L222.0,245.5 L198.5,226.0 L193.5,216.0 L210.0,196.5 L225.0,216.5 L243.0,225.5 L266.0,223.5 L291.0,205.5 L298.0,206.5 L304.5,212.0 L305.5,224.0 L292.0,238.5 L279.0,246.5 L256.0,252.5Z"
          fill={`url(#${gradientId})`}
          fillRule="evenodd"
          stroke={`url(#${gradientId})`}
          strokeWidth="2"
          initial={{ pathLength: 0, fillOpacity: 0 }}
          animate={{ pathLength: 1, fillOpacity: 1 }}
          transition={{
            pathLength: { duration: 1.8, ease: "easeInOut", delay },
            fillOpacity: { duration: 0.8, ease: "easeIn", delay: delay + 1.5 },
          }}
        />
      </svg>
    </motion.div>
  );
}

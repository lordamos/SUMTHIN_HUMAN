import React from 'react';

interface GaugeProps {
  score: number;
}

const Gauge: React.FC<GaugeProps> = ({ score }) => {
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = (value: number) => {
    if (value > 75) return 'stroke-red-500';
    if (value > 40) return 'stroke-amber-400';
    return 'stroke-teal-500';
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-48 h-48 transform -rotate-90">
        <circle
          className="text-white/10"
          strokeWidth="10"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="96"
          cy="96"
        />
        <circle
          className={`${getColor(score)} transition-all duration-1000 ease-out`}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="96"
          cy="96"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-white">{score}%</span>
        <span className="text-sm text-gray-400">AI Likelihood</span>
      </div>
    </div>
  );
};

export default Gauge;

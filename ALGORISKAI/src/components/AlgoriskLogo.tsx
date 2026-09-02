import riskVisionLogo from '../assets/RiskVision.png';

interface AlgoriskLogoProps {
  size?: number;
  className?: string;
}

export default function AlgoriskLogo({ size = 40, className = '' }: AlgoriskLogoProps) {
  return (
    <img 
      src={riskVisionLogo} 
      alt="RiskVision Logo" 
      width={size} 
      height={size} 
      className={`object-contain ${className}`} 
    />
  );
}


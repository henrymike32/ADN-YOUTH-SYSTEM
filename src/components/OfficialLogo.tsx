import React from 'react';
import logoSvg from '../assets/images/archdiocese_nyeri_youth_logo.svg';

interface OfficialLogoProps {
  className?: string;
  showText?: boolean;
}

export const OfficialLogo: React.FC<OfficialLogoProps> = ({ 
  className = "h-14 w-auto", 
}) => {
  return (
    <img
      src={logoSvg}
      alt="Archdiocese of Nyeri Youth - Faith on Fire"
      className={`object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};

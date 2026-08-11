import React, { useState, useEffect } from 'react';
import { companyProfile } from '../config/companyProfile';

export interface ReportHeaderProps {
  title: string;
  dynamicData: { label: string; value: string | number }[];
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, dynamicData }) => {
  const [logoSrc, setLogoSrc] = useState<string>(companyProfile.logo);

  useEffect(() => {
    let isMounted = true;
    const convertLogoToBase64 = async () => {
      try {
        const url = companyProfile.logo.startsWith('http') 
          ? companyProfile.logo 
          : `${window.location.origin}${companyProfile.logo.startsWith('/') ? '' : '/'}${companyProfile.logo}`;
          
        const response = await fetch(url);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted && reader.result) {
            setLogoSrc(reader.result as string);
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error('Failed to convert logo to base64:', error);
      }
    };

    convertLogoToBase64();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="hidden print:block w-full border-b-2 border-gray-800 pb-2 mb-2">
      <div className="flex justify-between items-start w-full">
        {/* Right Side: Company Details */}
        <div className="text-right flex flex-col gap-0.5">
          <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">{companyProfile.name}</h1>
          <p className="text-xs font-semibold text-gray-700">{companyProfile.address}</p>
          <p className="text-xs font-semibold text-gray-700" dir="rtl">
            <span>هاتف: </span>
            <span dir="ltr" className="inline-block">{companyProfile.phones}</span>
          </p>
        </div>
        
        {/* Left Side: Logo */}
        <div className="flex-shrink-0 ml-2">
          <img 
            src={logoSrc} 
            alt="شعار المنشأة" 
            className="h-20 w-20 object-contain"
          />
        </div>
      </div>

      {/* Center: Report Title */}
      <div className="flex justify-center mt-1 mb-2">
        <h2 className="text-sm font-bold text-gray-900 bg-gray-100 border border-gray-300 px-6 py-0.5 rounded">
          {title}
        </h2>
      </div>

      {/* Bottom: Dynamic Info */}
      <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-1 text-xs">
        {dynamicData.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-600">{item.label}:</span>
            <span className="font-bold text-gray-900 border-b border-gray-300 border-dotted min-w-[50px] text-center">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

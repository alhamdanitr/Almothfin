import React from 'react';
import { companyProfile } from '../config/companyProfile';

export interface ReportHeaderProps {
  title: string;
  dynamicData: { label: string; value: string | number }[];
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, dynamicData }) => {
  return (
    <div className="hidden print:block w-full border-b-4 border-double border-gray-900 pb-4 mb-4">
      <div className="flex justify-between items-center w-full mb-4">
        {/* Right Side: Company Details - Professional Layout */}
        <div className="text-right flex flex-col gap-1 max-w-[60%]">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-tight mb-1">
            {companyProfile.name}
          </h1>
          <div className="space-y-0.5">
            <p className="text-sm font-bold text-gray-800">{companyProfile.address}</p>
            <p className="text-sm font-bold text-gray-800" dir="rtl">
              <span className="ml-1">هاتف:</span>
              <span dir="ltr" className="inline-block tracking-wider">{companyProfile.phones}</span>
            </p>
          </div>
        </div>
        
        {/* Left Side: Larger & Prominent Logo - Slightly Increased Size */}
        <div className="flex-shrink-0 ml-4 print:block">
          <img 
            src={companyProfile.logo} 
            alt="شعار المنشأة" 
            className="h-40 w-40 object-contain print:block print:max-h-40 print:max-w-40 drop-shadow-sm"
            style={{ display: 'block', visibility: 'visible', printColorAdjust: 'exact' }}
          />
        </div>
      </div>

      {/* Center: Report Title with Professional Badge Style */}
      <div className="flex justify-center mt-2 mb-4">
        <div className="bg-gray-900 text-white px-10 py-1 rounded-md transform -skew-x-12">
          <h2 className="text-lg font-black tracking-widest transform skew-x-12">
            {title}
          </h2>
        </div>
      </div>

      {/* Bottom: Dynamic Info - Grid Style for Clarity */}
      <div className="grid grid-cols-3 gap-4 text-xs border-t border-gray-200 pt-3">
        {dynamicData.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="font-extrabold text-gray-600 whitespace-nowrap">{item.label}:</span>
            <span className="font-black text-gray-900 border-b-2 border-gray-400 border-dotted flex-grow text-center pb-0.5">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

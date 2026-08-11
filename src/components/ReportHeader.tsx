import React from 'react';
import { companyProfile } from '../config/companyProfile';

export interface ReportHeaderProps {
  title: string;
  dynamicData: { label: string; value: string | number }[];
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, dynamicData }) => {
  return (
    <div className="hidden print:block w-full border-b-2 border-gray-900 pb-2 mb-1">
      <div className="flex justify-between items-center w-full mb-2">
        {/* Right Side: Company Details - Exact match to user's favorite bold style */}
        <div className="text-right flex flex-col gap-2 max-w-[75%]">
          <h1 className="text-[24px] font-[900] text-gray-900 tracking-tight leading-tight mb-1 font-cairo">
            {companyProfile.name}
          </h1>
          <div className="space-y-1.5">
            <p className="text-[14px] font-[800] text-gray-800 font-cairo">{companyProfile.address}</p>
            <p className="text-[14px] font-[800] text-gray-800 font-cairo" dir="rtl">
              <span className="ml-1">هاتف:</span>
              <span dir="ltr" className="inline-block tracking-wider">{companyProfile.phones}</span>
            </p>
          </div>
        </div>
        
        {/* Left Side: Prominent Logo - Balanced size */}
        <div className="flex-shrink-0 ml-2 print:block">
          <img 
            src={companyProfile.logo} 
            alt="شعار المنشأة" 
            className="h-24 w-24 object-contain print:block print:max-h-24 print:max-w-24"
            style={{ display: 'block', visibility: 'visible', printColorAdjust: 'exact' }}
          />
        </div>
      </div>

      {/* Center: Report Title - Dark Badge Style */}
      <div className="flex justify-center my-1">
        <div className="bg-slate-900 text-white px-12 py-1 rounded-md">
          <h2 className="text-[14px] font-[900] tracking-widest font-cairo">
            {title}
          </h2>
        </div>
      </div>

      {/* Bottom: Dynamic Info - Precise Dotted Lines */}
      <div className="flex justify-between items-center text-[11px] border-t border-gray-300 pt-2 mt-1">
        {dynamicData.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <span className="font-[800] text-gray-700 whitespace-nowrap">{item.label}:</span>
            <span className="font-[900] text-gray-900 border-b border-gray-400 border-dotted px-4 min-w-[80px] text-center">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

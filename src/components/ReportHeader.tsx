import React from 'react';
import { companyProfile } from '../config/companyProfile';

export interface ReportHeaderProps {
  title: string;
  dynamicData: { label: string; value: string | number }[];
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, dynamicData }) => {
  return (
    <div className="hidden print:block w-full border-b-2 border-gray-800 pb-2 mb-2">
      <div className="flex justify-between items-center w-full mb-2">
        {/* Right Side: Company Details */}
        <div className="text-right flex flex-col gap-1.5">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{companyProfile.name}</h1>
          <p className="text-base font-bold text-gray-800">{companyProfile.address}</p>
          <p className="text-base font-bold text-gray-800" dir="rtl">
            <span>هاتف: </span>
            <span dir="ltr" className="inline-block">{companyProfile.phones}</span>
          </p>
        </div>
        
        {/* Left Side: Logo */}
        <div className="flex-shrink-0 ml-2">
          <img 
            src={companyProfile.logo} 
            alt="شعار المنشأة" 
            className="h-24 w-auto object-contain mix-blend-multiply"
          />
        </div>
      </div>

      {/* Center: Report Title */}
      <div className="flex justify-center mt-2 mb-4">
        <h2 className="text-lg font-black text-gray-900 bg-gray-100 border-2 border-gray-300 px-10 py-1.5 rounded-md shadow-sm">
          {title}
        </h2>
      </div>

      {/* Bottom: Dynamic Info */}
      <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 text-sm">
        {dynamicData.map((item, index) => (
          <div key={index} className="flex items-center gap-1.5">
            <span className="font-bold text-gray-700">{item.label}:</span>
            <span className="font-black text-gray-900 border-b-2 border-gray-400 border-dotted min-w-[60px] text-center pb-0.5">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

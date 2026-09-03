import React from 'react';
import { useStore } from '../hooks/useStore';

export interface ReportHeaderProps {
  title: string;
  dynamicData: { label: string; value: string | number }[];
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ title, dynamicData }) => {
  const { activeCompany } = useStore();
  
  if (!activeCompany) return null;

  return (
    <div className="hidden print:block w-full border-b-2 border-gray-900 pb-2 mb-1">
      <div className="flex justify-between items-center w-full mb-2">
        {/* Right Side: Company Details */}
        <div className="text-right flex flex-col gap-2 max-w-[75%]">
          <h1 className="text-[24px] font-[900] text-text-main tracking-tight leading-tight mb-1 font-cairo">
            {activeCompany.name}
          </h1>
          <div className="space-y-1.5">
            <p className="text-[14px] font-[800] text-text-main font-cairo">{activeCompany.address}</p>
            {activeCompany.phones && (
              <p className="text-[14px] font-[800] text-text-main font-cairo" dir="rtl">
                <span className="ml-1">هاتف:</span>
                <span dir="ltr" className="inline-block tracking-wider">{activeCompany.phones}</span>
              </p>
            )}
          </div>
        </div>
        
        {/* Left Side: Logo */}
        <div className="flex-shrink-0 ml-4 print:block">
          {activeCompany.logoBase64 && (
            <img 
              src={activeCompany.logoBase64} 
              alt="شعار المنشأة" 
              className="report-logo h-36 w-36 object-contain print:block print:max-h-36 print:max-w-36 drop-shadow-md"
              style={{ display: 'block', visibility: 'visible', printColorAdjust: 'exact' }}
            />
          )}
        </div>
      </div>

      {/* Center: Report Title */}
      <div className="flex justify-center my-1">
        <div className="bg-slate-900 text-white px-12 py-1 rounded-md">
          <h2 className="text-[14px] font-[900] tracking-widest font-cairo">
            {title}
          </h2>
        </div>
      </div>

      {/* Bottom: Dynamic Info */}
      <div className="flex justify-between items-center text-[11px] border-t border-border-main pt-2 mt-1">
        {dynamicData.map((item, index) => (
          <div key={index} className="flex items-center gap-1">
            <span className="font-[800] text-text-main whitespace-nowrap">{item.label}:</span>
            <span className="font-[900] text-text-main border-b border-gray-400 border-dotted px-4 min-w-[80px] text-center">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};


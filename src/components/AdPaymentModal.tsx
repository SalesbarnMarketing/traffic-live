import React, { useState } from 'react';
import {
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  ShieldCheck,
  X,
  Sparkles,
  Lock,
  RefreshCw,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { submitPayFastForm } from '../utils/payfast';

export interface AdPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    referenceNumber: string;
    amount: number;
    packageName: string;
    businessName: string;
    paymentMethod: 'payfast' | 'eft';
    durationDays?: number;
  };
  payfastData?: {
    processUrl: string;
    paymentFields: Record<string, string>;
    paymentId: string;
  } | null;
  onSuccessConfirmation?: () => void;
}

export const AdPaymentModal: React.FC<AdPaymentModalProps> = ({
  isOpen,
  onClose,
  order,
  payfastData,
  onSuccessConfirmation
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmittingGateway, setIsSubmittingGateway] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, fieldKey: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProceedPayFast = () => {
    if (!payfastData) return;
    setIsSubmittingGateway(true);
    submitPayFastForm(payfastData.processUrl, payfastData.paymentFields, true);
    setTimeout(() => {
      setIsSubmittingGateway(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-[#0A101D] border-2 border-[#D4A237] rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-5 text-white max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#D4A237]/20 border border-[#D4A237]/50 flex items-center justify-center text-[#D4A237]">
              {order.paymentMethod === 'payfast' ? <CreditCard className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider">
                {order.paymentMethod === 'payfast' ? 'PayFast Instant Checkout' : 'Bank EFT Payment Details'}
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">Ref: {order.referenceNumber}</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Summary Card */}
        <div className="bg-[#05080E] border border-slate-800 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Campaign Package:</span>
            <span className="font-bold text-white">{order.packageName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Advertiser / Brand:</span>
            <span className="font-bold text-slate-200">{order.businessName}</span>
          </div>
          {order.durationDays && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Active Display Period:</span>
              <span className="font-bold text-[#D4A237]">{order.durationDays} Days Active Rotation</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm border-t border-slate-800/80 pt-2.5">
            <span className="font-black text-slate-300 uppercase tracking-wider">Amount Due:</span>
            <span className="text-lg font-black text-[#D4A237]">R{order.amount.toLocaleString()} ZAR</span>
          </div>
        </div>

        {/* PAYFAST INSTANT FLOW */}
        {order.paymentMethod === 'payfast' && (
          <div className="space-y-4">
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-2xl p-4 text-xs text-emerald-300 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>PayFast PCI-DSS 256-Bit Encrypted Payment</span>
              </div>
              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                Supports Visa, Mastercard, Instant EFT, Capitec Pay, SnapScan, Zapper, and Masterpass. Your ad campaign will be activated in rotation automatically upon successful payment.
              </p>
            </div>

            {payfastData && (
              <button
                type="button"
                onClick={handleProceedPayFast}
                disabled={isSubmittingGateway}
                className="w-full py-3.5 px-4 bg-[#D4A237] hover:bg-[#F5D061] text-[#070A10] font-black text-xs sm:text-sm rounded-xl uppercase tracking-wider shadow-xl flex items-center justify-center space-x-2 cursor-pointer transition disabled:opacity-50"
              >
                {isSubmittingGateway ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-[#070A10]" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-[#070A10]" />
                    <span>Proceed to PayFast Gateway (R{order.amount.toLocaleString()})</span>
                    <ExternalLink className="w-4 h-4 text-[#070A10]" />
                  </>
                )}
              </button>
            )}

            <p className="text-[10px] text-center text-slate-400">
              A secure checkout tab should open automatically. If your browser blocked popups, click the button above.
            </p>
          </div>
        )}

        {/* DIRECT EFT BANK DETAILS */}
        {order.paymentMethod === 'eft' && (
          <div className="space-y-4">
            <div className="bg-[#05080E] border border-[#D4A237]/40 rounded-2xl p-4 space-y-3">
              <div className="text-xs font-black uppercase text-[#D4A237] tracking-wider flex items-center space-x-1.5">
                <Building2 className="w-3.5 h-3.5" />
                <span>Live Traffic NPC Official Bank Account</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between bg-[#0A101D] p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Bank Name</span>
                    <span className="font-bold text-white">First National Bank (FNB)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#0A101D] p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Account Name</span>
                    <span className="font-bold text-white">Live Traffic NPC NPC Road Safety</span>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#0A101D] p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Account Number</span>
                    <span className="font-mono font-bold text-[#D4A237] text-sm">63019844211</span>
                  </div>
                  <button
                    onClick={() => handleCopy('63019844211', 'account')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg flex items-center space-x-1 text-slate-200 cursor-pointer"
                  >
                    {copiedField === 'account' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'account' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#0A101D] p-2.5 rounded-xl border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Branch Code</span>
                    <span className="font-mono font-bold text-white">250655</span>
                  </div>
                  <button
                    onClick={() => handleCopy('250655', 'branch')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs rounded-lg flex items-center space-x-1 text-slate-200 cursor-pointer"
                  >
                    {copiedField === 'branch' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'branch' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between bg-[#0A101D] p-2.5 rounded-xl border-2 border-[#D4A237]/70">
                  <div>
                    <span className="text-[10px] text-[#D4A237] font-bold block uppercase">Payment Reference (CRITICAL)</span>
                    <span className="font-mono font-black text-white text-sm">{order.referenceNumber}</span>
                  </div>
                  <button
                    onClick={() => handleCopy(order.referenceNumber, 'ref')}
                    className="px-2.5 py-1 bg-[#D4A237] text-[#070A10] font-black text-xs rounded-lg flex items-center space-x-1 cursor-pointer"
                  >
                    {copiedField === 'ref' ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'ref' ? 'Copied' : 'Copy Ref'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-950/30 border border-blue-500/30 p-3 rounded-xl text-[11px] text-blue-200 flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>
                Please use <strong>{order.referenceNumber}</strong> as the recipient payment reference so our automated reconciliation engine matches your campaign immediately. Send proof of payment to <strong>advertising@livetrafficnpc.co.za</strong>.
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl cursor-pointer"
          >
            Close & Go to Dashboard
          </button>
        </div>

      </div>
    </div>
  );
};

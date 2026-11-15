import { useEffect } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  MessageCircle,
  X,
} from 'lucide-react';
import { LockBookingExecutionResult } from '../services/apiPlaceholders';
import { formatZar } from '../services/conciergeApi';

interface BookingConfirmationModalProps {
  result: LockBookingExecutionResult | null;
  onClose: () => void;
}

export function BookingConfirmationModal({
  result,
  onClose,
}: BookingConfirmationModalProps) {
  useEffect(() => {
    if (!result) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [result, onClose]);

  if (!result) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#121212] text-[#FAF9F6] border border-[#C5A059]/40 rounded-sm overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-[#181818] border-b border-white/10 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <CheckCircle2
              className="w-6 h-6 text-[#C5A059] mt-0.5 shrink-0 stroke-[1.75]"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#C5A059]">
                Dates Provisionally Locked
              </p>
              <h3
                id="booking-modal-title"
                className="font-display text-2xl sm:text-3xl font-medium text-[#FAF9F6] mt-0.5"
              >
                Quote Reference {result.referenceCode}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close confirmation modal"
            className="w-10 h-10 inline-flex items-center justify-center text-[#FAF9F6]/70 hover:text-[#FAF9F6] border border-white/10 rounded-sm transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-sm text-[#FAF9F6]/80 leading-relaxed">
            Thank you, <span className="font-semibold text-[#FAF9F6]">{result.contact.fullName}</span>.
            Your provisional booking for{' '}
            <span className="font-semibold text-[#FAF9F6]">{result.contact.suburbOrEstate}</span>{' '}
            ({result.quoteInput.checkInDate} to {result.quoteInput.checkOutDate}) has been synced
            and queued for guardian assignment.
          </p>

          {/* Financial Summary Box */}
          <div className="bg-[#1A1A1A] border border-white/10 rounded-sm p-4 space-y-2 text-sm tabular-nums">
            <div className="flex justify-between text-[#FAF9F6]/75">
              <span>Service Tier</span>
              <span className="text-[#FAF9F6] font-medium">{result.breakdown.baseTierLabel}</span>
            </div>
            <div className="flex justify-between text-[#FAF9F6]/75">
              <span>Total Quote Amount</span>
              <span className="text-[#FAF9F6] font-medium">
                {formatZar(result.breakdown.estimatedTotal)}
              </span>
            </div>
            <div className="flex justify-between text-[#C5A059] font-semibold pt-2 border-t border-white/10">
              <span>50% Deposit Due to Confirm</span>
              <span>{formatZar(result.breakdown.depositAmount)}</span>
            </div>
          </div>

          {/* Placeholder Integration Confirmations */}
          <div className="space-y-2.5 text-xs text-[#FAF9F6]/75">
            <div className="flex items-start gap-2.5 p-3 bg-[#181818] border border-white/10 rounded-sm">
              <CreditCard className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" aria-hidden="true" />
              <div className="flex-1">
                <p className="font-semibold text-[#FAF9F6]">
                  Paystack 50% Deposit Link Prepared
                </p>
                <p className="font-mono text-[11px] text-[#FAF9F6]/60 mt-0.5">
                  Ref: {result.paystack.reference} · {formatZar(result.paystack.amountZar)} ZAR
                </p>
              </div>
              <a
                href={result.paystack.authorizationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#C5A059] hover:text-[#D4B26E] font-medium whitespace-nowrap"
              >
                <span>Pay Deposit</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-[#181818] border border-white/10 rounded-sm">
              <CalendarCheck2
                className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-[#FAF9F6]">
                  Google Calendar Guardian Hold Synced
                </p>
                <p className="text-[11px] text-[#FAF9F6]/60 mt-0.5">
                  {result.calendar.summary}
                </p>
              </div>
            </div>
          </div>

          {/* Primary WhatsApp Handoff Action */}
          <div className="pt-2 space-y-3">
            <a
              href={result.whatsapp.whatsappHandoffUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full min-h-[48px] bg-[#C5A059] hover:bg-[#D4B26E] text-[#121212] font-semibold text-sm px-5 py-3 rounded-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4 stroke-[2]" aria-hidden="true" />
              <span>Open WhatsApp Handoff (Ref: {result.referenceCode})</span>
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[42px] text-xs font-medium text-[#FAF9F6]/70 hover:text-[#FAF9F6] transition-colors cursor-pointer"
            >
              Return to Quote &amp; Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useRef, useState } from 'react';

interface Props {
  onChange: (code: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OtpCodeInput: React.FC<Props> = ({ onChange, disabled = false, autoFocus = false }) => {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  const update = (next: string[], focusIndex?: number) => {
    setDigits(next);
    onChange(next.join(''));
    if (focusIndex !== undefined) refs.current[focusIndex]?.focus();
  };

  const enter = (index: number, raw: string) => {
    const numbers = raw.replace(/\D/g, '').slice(0, 6 - index);
    if (!numbers) {
      const next = [...digits];
      next[index] = '';
      update(next);
      return;
    }
    const next = [...digits];
    [...numbers].forEach((digit, offset) => { next[index + offset] = digit; });
    update(next, Math.min(index + numbers.length, 5));
  };

  return (
    <div role="group" aria-label="Six-digit verification code" className="flex w-full max-w-sm gap-2">
      {digits.map((digit, index) => (
        <input key={index} ref={(element) => { refs.current[index] = element; }}
          type="text" inputMode="numeric" autoComplete={index === 0 ? 'one-time-code' : 'off'}
          aria-label={`Digit ${index + 1} of 6`} maxLength={6} disabled={disabled}
          autoFocus={autoFocus && index === 0} value={digit}
          onChange={(event) => enter(index, event.target.value)}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
            if (!pasted) return;
            event.preventDefault();
            const next = Array(6).fill('');
            [...pasted].forEach((number, offset) => { next[offset] = number; });
            update(next, Math.min(pasted.length, 5));
          }}
          onKeyDown={(event) => {
            if (event.key === 'Backspace') {
              event.preventDefault();
              const target = digit ? index : Math.max(0, index - 1);
              const next = [...digits];
              next[target] = '';
              update(next, target);
            } else if (event.key === 'ArrowLeft' && index > 0) {
              event.preventDefault();
              refs.current[index - 1]?.focus();
            } else if (event.key === 'ArrowRight' && index < 5) {
              event.preventDefault();
              refs.current[index + 1]?.focus();
            }
          }}
          onFocus={(event) => event.target.select()}
          className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-slate-50 text-center text-xl font-semibold text-slate-900 outline-none transition-colors focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 disabled:opacity-60 sm:h-14" />
      ))}
    </div>
  );
};

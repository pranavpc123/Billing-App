export function PaymentSeal() {
  return (
    <div
      className="pointer-events-none flex h-24 w-24 shrink-0 -rotate-[12deg] select-none items-center justify-center rounded-full border-[3px] border-double border-gold-700 text-center"
      aria-hidden="true"
    >
      <span className="font-serif text-[10px] font-bold leading-tight tracking-wide text-gold-800">
        PAYMENT
        <br />
        RECEIVED
      </span>
    </div>
  );
}

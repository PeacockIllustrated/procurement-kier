export default function TbdPrice({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center bg-amber-50 text-amber-500 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200 tracking-wide ${className}`}
    >
      TBD
    </span>
  );
}

// Text wordmark until the real logo arrives. To switch: drop logo.svg into /public and
// render <Image src="/logo.svg" alt="ANUBIS" width={120} height={24} priority /> here.
export default function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`text-base font-extrabold tracking-[0.35em] ${className}`}>ANUBIS</span>
  );
}

import logoUrl from "@/assets/hero-banner.png";

export function HibernationLogo({ size = 32 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full overflow-hidden ring-1 ring-border bg-white"
      style={{ width: size, height: size }}
    >
      <img
        src={logoUrl}
        alt="Hibernation Portal logo"
        className="w-full h-full object-cover scale-[2.2] origin-center"
        draggable={false}
      />
    </span>
  );
}

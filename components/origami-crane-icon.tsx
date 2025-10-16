import Image from "next/image"

export function OrigamiCraneIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/voart-eagle-logo.png"
        alt="VOart Eagle Logo"
        fill
        className="object-contain brightness-200 contrast-125"
      />
    </div>
  )
}

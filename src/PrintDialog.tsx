import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

type Props = { titleId: string; children: ReactNode; onClose: () => void; className?: string };

export function PrintDialog({ titleId, children, onClose, className = "" }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") { event.preventDefault(); closeButton.current?.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      previousFocus?.focus();
    };
  }, [onClose]);
  return <div className="snapshot-overlay" onClick={onClose} role="presentation">
    <section className="snapshot-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} onClick={event => event.stopPropagation()}>
      <div className="snapshot-toolbar"><span>Pronto para o print.</span><button ref={closeButton} onClick={onClose} type="button" aria-label="Fechar modo print"><X size={20}/></button></div>
      <div className={`snapshot-card ${className}`}>
        <div className="snapshot-brand"><span className="brand">WHO’S WHO<span>?</span></span><span>ENTRE AMIGOS</span></div>
        {children}
        <div className="snapshot-credit"><span>whoiswho-phi.vercel.app</span><span>O grupo não perdoa.</span></div>
      </div>
    </section>
  </div>;
}

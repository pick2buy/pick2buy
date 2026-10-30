import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useModal } from '../../hooks/useModal';

export function ProductImageViewer({ images, initialImage, name, onClose }: {
  images: string[];
  initialImage: string;
  name: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(Math.max(0, images.indexOf(initialImage)));
  const [zoomed, setZoomed] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const modal = useModal(true, onClose);
  const select = (next: number) => {
    setIndex((next + images.length) % images.length);
    setZoomed(false);
    viewport.current?.scrollTo(0, 0);
  };

  return createPortal(
    <div ref={modal} role="dialog" aria-modal="true" aria-label={`${name} image gallery`}
      className="fixed inset-0 z-[100] flex h-[100dvh] flex-col bg-white"
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') { event.preventDefault(); select(index - 1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); select(index + 1); }
      }}>
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-4 py-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
        <button type="button" onClick={onClose} aria-label="Close image viewer" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100"><X size={22} /></button>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{name}</p>
        <span className="text-xs text-slate-500" aria-live="polite">{index + 1} / {images.length}</span>
        <button type="button" aria-label={zoomed ? 'Zoom out' : 'Zoom in'} aria-pressed={zoomed} onClick={() => setZoomed(value => !value)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100">{zoomed ? <ZoomOut size={22} /> : <ZoomIn size={22} />}</button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={viewport} className="h-full overflow-auto"
          onTouchStart={event => { touchStart.current = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }}
          onTouchCancel={() => { touchStart.current = null; }}
          onTouchEnd={event => {
            const start = touchStart.current;
            touchStart.current = null;
            if (!start || zoomed || !event.changedTouches.length) return;
            const dx = event.changedTouches[0].clientX - start.x;
            const dy = event.changedTouches[0].clientY - start.y;
            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) select(index + (dx < 0 ? 1 : -1));
          }}>
          <img src={images[index]} alt={`${name}, image ${index + 1}`} draggable={false}
            className={zoomed ? 'block h-[200%] w-[200%] max-w-none object-contain' : 'block h-full w-full object-contain p-3'} />
        </div>
        {images.length > 1 && <>
          <button type="button" onClick={() => select(index - 1)} aria-label="Previous image" className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md"><ChevronLeft /></button>
          <button type="button" onClick={() => select(index + 1)} aria-label="Next image" className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md"><ChevronRight /></button>
        </>}
      </div>
      {images.length > 1 && <div className="flex shrink-0 gap-3 overflow-x-auto border-t border-slate-100 p-3" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        {images.map((url, i) => <button key={`${url}-${i}`} type="button" aria-label={`View image ${i + 1}`} aria-pressed={index === i} onClick={() => select(i)} className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${index === i ? 'border-brand-primary' : 'border-slate-200'}`}><img src={url} alt="" className="h-full w-full object-contain" /></button>)}
      </div>}
    </div>, document.body,
  );
}

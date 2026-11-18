import { useEffect, useRef, useState } from 'react';
import './PhotoSlideshow.css';

const photos = [
  'PHOTO-2026-01-09-14-38-17.jpg',
  'PHOTO-2026-01-09-14-41-52.jpg',
  'PHOTO-2026-01-09-16-41-32.jpg',
  'PHOTO-2026-01-11-12-02-20.jpg',
  'PHOTO-2026-01-11-12-02-20_1.jpg',
  'PHOTO-2026-02-06-09-54-07.jpg',
  'PHOTO-2026-02-06-09-54-08.jpg',
  'PHOTO-2026-02-06-09-54-08_1.jpg',
  'PHOTO-2026-02-06-09-54-08_2.jpg',
  'PHOTO-2026-02-06-09-54-08_3.jpg',
  'PHOTO-2026-04-04-16-55-24.jpg',
  'PHOTO-2026-06-12-13-42-28.jpg',
  'PHOTO-2026-06-24-19-59-33.jpg',
  'PHOTO-2026-06-25-18-38-27.jpg',
  'PHOTO-2026-06-25-18-38-28.jpg',
  'PHOTO-2026-07-04-19-34-44.jpg',
  'PHOTO-2026-07-04-19-40-04.jpg',
  'PHOTO-2026-07-04-19-40-06.jpg',
  'PHOTO-2026-07-04-19-40-08.jpg',
  'PHOTO-2026-07-13-12-00-32.jpg',
  'PHOTO-2026-07-20-13-48-33.jpg',
  'PHOTO-2026-10-17-20-05-42.jpg',
  'PHOTO-2026-10-17-20-05-42_1.jpg',
];

export function PhotoSlideshow() {
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number; startX: number; startScrollLeft: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollLeft = viewport.scrollWidth / 2;
    }
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (
      !viewport ||
      isDragging ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let frameId = 0;
    let previousTime: number | null = null;
    const speed = 30;

    const movePhotos = (time: number) => {
      if (previousTime !== null) {
        viewport.scrollLeft -= speed * ((time - previousTime) / 1000);
        if (viewport.scrollLeft <= 0) {
          viewport.scrollLeft = viewport.scrollWidth / 2;
        }
      }
      previousTime = time;
      frameId = window.requestAnimationFrame(movePhotos);
    };

    frameId = window.requestAnimationFrame(movePhotos);
    return () => window.cancelAnimationFrame(frameId);
  }, [isDragging]);

  const finishDragging = (pointerId: number) => {
    const viewport = viewportRef.current;
    if (dragRef.current?.pointerId !== pointerId) return;

    dragRef.current = null;
    setIsDragging(false);

    if (viewport?.hasPointerCapture(pointerId)) {
      viewport.releasePointerCapture(pointerId);
    }
  };

  const renderPhotos = (isDuplicate: boolean) => (
    <div
      className="photo-strip"
      aria-hidden={isDuplicate}
    >
      {photos.map((photo, index) => (
        <img
          key={photo}
          src={`/${photo}`}
          alt={isDuplicate ? '' : `Photo ${index + 1} de l'Amicale`}
          loading="lazy"
          draggable={false}
        />
      ))}
    </div>
  );

  return (
    <section aria-label="Photos de l'Amicale" className="photo-gallery">
      <div
        className={`photo-gallery-viewport${isDragging ? ' is-dragging' : ''}`}
        ref={viewportRef}
        onPointerDown={(event) => {
          if (event.pointerType === 'mouse' && event.button !== 0) return;

          const viewport = viewportRef.current;
          if (!viewport) return;

          dragRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startScrollLeft: viewport.scrollLeft,
          };
          setIsDragging(true);
          viewport.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const drag = dragRef.current;
          const viewport = viewportRef.current;
          if (!drag || drag.pointerId !== event.pointerId || !viewport) return;

          event.preventDefault();
          const loopPoint = viewport.scrollWidth / 2;
          if (loopPoint <= 0) return;

          const position = drag.startScrollLeft - (event.clientX - drag.startX);
          viewport.scrollLeft = ((position % loopPoint) + loopPoint) % loopPoint;
        }}
        onPointerUp={(event) => finishDragging(event.pointerId)}
        onPointerCancel={(event) => finishDragging(event.pointerId)}
        onLostPointerCapture={(event) => finishDragging(event.pointerId)}
        aria-label="Faites glisser les photos avec la souris ou le doigt"
      >
        <div className="photo-marquee">
          {renderPhotos(false)}
          {renderPhotos(true)}
        </div>
      </div>
    </section>
  );
}

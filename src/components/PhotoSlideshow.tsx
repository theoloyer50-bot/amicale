import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
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
  const [isPaused, setIsPaused] = useState(() =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

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
      isPaused ||
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
  }, [isPaused]);

  const scrollManually = (direction: 'left' | 'right') => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    setIsPaused(true);
    const loopPoint = viewport.scrollWidth / 2;
    const distance = Math.min(viewport.clientWidth * 0.8, loopPoint / 2);

    if (direction === 'left') {
      if (viewport.scrollLeft + distance >= loopPoint) {
        viewport.scrollLeft = 0;
      }
      viewport.scrollBy({ left: distance, behavior: 'smooth' });
    } else {
      if (viewport.scrollLeft <= distance) {
        viewport.scrollLeft = loopPoint;
      }
      viewport.scrollBy({ left: -distance, behavior: 'smooth' });
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
        />
      ))}
    </div>
  );

  return (
    <section aria-label="Photos de l'Amicale" className="photo-gallery">
      <div className="photo-gallery-viewport" ref={viewportRef}>
        <div className="photo-marquee">
          {renderPhotos(false)}
          {renderPhotos(true)}
        </div>
      </div>
      <div className="photo-gallery-controls">
        <button
          type="button"
          onClick={() => scrollManually('left')}
          aria-label="Faire défiler les photos vers la gauche"
          title="Défiler vers la gauche"
        >
          <ChevronLeft aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => setIsPaused((paused) => !paused)}
          aria-label={isPaused ? 'Reprendre le défilement automatique' : 'Mettre en pause le défilement automatique'}
          title={isPaused ? 'Reprendre le défilement' : 'Mettre en pause'}
        >
          {isPaused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </button>
        <button
          type="button"
          onClick={() => scrollManually('right')}
          aria-label="Faire défiler les photos vers la droite"
          title="Défiler vers la droite"
        >
          <ChevronRight aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

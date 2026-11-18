import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const photos = [
  'PHOTO-2026-01-09-14-38-17.jpg',
  'PHOTO-2026-01-09-14-41-52.jpg',
  'PHOTO-2026-01-09-16-41-32.jpg',
  'PHOTO-2026-01-11-12-02-20.jpg',
  'PHOTO-2026-01-11-12-02-20_1.jpg',
  'PHOTO-2026-02-06-09-47-45.jpg',
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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % photos.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const showPrevious = () => {
    setCurrentIndex((index) => (index - 1 + photos.length) % photos.length);
  };

  const showNext = () => {
    setCurrentIndex((index) => (index + 1) % photos.length);
  };

  return (
    <section aria-label="Photos de l'Amicale" className="bg-gray-900 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-center text-2xl font-semibold text-white sm:text-3xl">
          La vie de l'Amicale en images
        </h2>
        <div className="relative overflow-hidden rounded-2xl bg-black shadow-xl">
          <img
            src={`/${photos[currentIndex]}`}
            alt={`Photo ${currentIndex + 1} sur ${photos.length} de l'Amicale des Sapeurs-Pompiers de Tourlaville`}
            className="h-[280px] w-full object-contain sm:h-[440px]"
          />
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Photo précédente"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Photo suivante"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/60 p-2 text-white transition hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
          <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
            {currentIndex + 1} / {photos.length}
          </p>
        </div>
      </div>
    </section>
  );
}

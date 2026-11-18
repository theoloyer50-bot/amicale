import './PhotoSlideshow.css';

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
  const renderPhotos = (isDuplicate: boolean) => (
    <div
      className="flex shrink-0 gap-3 pr-3"
      aria-hidden={isDuplicate}
    >
      {photos.map((photo, index) => (
        <img
          key={photo}
          src={`/${photo}`}
          alt={isDuplicate ? '' : `Photo ${index + 1} de l'Amicale`}
          loading="lazy"
          className="h-20 w-32 shrink-0 rounded-lg object-cover shadow-md sm:h-28 sm:w-44 md:w-48"
        />
      ))}
    </div>
  );

  return (
    <section aria-label="Photos de l'Amicale" className="bg-gray-900 py-5 sm:py-7">
      <h2 className="mb-4 text-center text-lg font-semibold text-white sm:text-xl">
        Quelques moments de l'Amicale
      </h2>
      <div className="overflow-hidden">
        <div className="photo-marquee flex w-max">
          {renderPhotos(false)}
          {renderPhotos(true)}
        </div>
      </div>
    </section>
  );
}

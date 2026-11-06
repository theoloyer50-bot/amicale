import { useState, useEffect } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  imageUrl: string;
}

export function Hero() {
  const [content, setContent] = useState<HeroContent>({
    title: 'Amicale des Sapeurs Pompiers',
    subtitle: 'de Tourlaville',
    description: 'Solidarité, Entraide et Convivialité au service de nos Sapeurs Pompiers',
    buttonText: 'Découvrir notre mission',
    imageUrl: 'https://images.unsplash.com/photo-1708451145511-7d84e4033df1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmaXJlZmlnaHRlcnMlMjB0cnVja3xlbnwxfHx8fDE3NjU0MzgzNDV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  });

  useEffect(() => {
    // Load content from localStorage if exists
    const saved = localStorage.getItem('heroContent');
    if (saved) {
      try {
        setContent(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading hero content:', error);
      }
    }
  }, []);

  return (
    <section id="accueil" className="relative h-[600px] flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <ImageWithFallback
          src={content.imageUrl}
          alt="Camion de pompiers"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 to-red-900/40"></div>
      </div>
      
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h2 className="text-4xl sm:text-5xl md:text-6xl mb-6">
          {content.title}
        </h2>
        <p className="text-xl sm:text-2xl mb-4">
          {content.subtitle}
        </p>
        <p className="text-lg sm:text-xl mb-8 text-gray-100">
          {content.description}
        </p>
        <button
          onClick={() => {
            const element = document.getElementById('apropos');
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className="bg-white text-red-700 px-8 py-3 rounded-lg hover:bg-red-50 transition"
        >
          {content.buttonText}
        </button>
      </div>
    </section>
  );
}
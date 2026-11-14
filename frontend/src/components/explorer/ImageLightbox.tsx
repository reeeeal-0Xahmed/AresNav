import React from 'react';
import { MarsImage } from '../../api/types';
import { X, ExternalLink, Calendar, Database } from 'lucide-react';

interface ImageLightboxProps {
  image: MarsImage | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ image, onClose }) => {
  if (!image) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-mars-surface border border-mars-border rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-mars-border bg-mars-dark">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-mars-orange" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {image.id || 'NASA Imagery'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-mars-surface transition-colors"
            aria-label="Close image modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Display */}
        <div className="max-h-[65vh] bg-black flex items-center justify-center overflow-hidden">
          <img
            src={image.img_src}
            alt={image.title}
            className="max-h-[65vh] w-auto object-contain"
          />
        </div>

        {/* Image Metadata Footer */}
        <div className="p-5 bg-mars-panel space-y-2">
          <h3 className="text-base font-semibold text-white font-sans">
            {image.title}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-mars-muted pt-1">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-mars-orange" />
              <span>Acquired: {image.date}</span>
            </span>

            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-mars-orange" />
              <span>Source: {image.source}</span>
            </span>

            <a
              href={image.img_src}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 ml-auto"
            >
              <span>Full Resolution</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

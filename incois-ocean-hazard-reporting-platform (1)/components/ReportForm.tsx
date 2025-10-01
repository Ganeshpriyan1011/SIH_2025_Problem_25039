import React, { useState, useEffect, useRef } from 'react';
import { HazardType } from '../types';
import { HAZARD_TYPES } from '../constants';
import Modal from './common/Modal';
import Button from './common/Button';
import Spinner from './common/Spinner';
import LocationPicker from './LocationPicker';
import { useLanguage } from '../contexts/LanguageContext';

interface ReportFormProps {
  onSubmit: (data: {
    hazard: HazardType;
    description: string;
    location: { lat: number; lng: number; name: string };
    image?: string;
  }) => Promise<void> | void;
  onClose: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onSubmit, onClose }) => {
  const [hazard, setHazard] = useState<HazardType>(HazardType.HighWaves);
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | undefined>();
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    if (!location) return;

    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    setIsGeocoding(true);
    setLocationName('');

    debounceTimeout.current = setTimeout(async () => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${location.lat}&lon=${location.lng}`);
        if (!response.ok) {
          throw new Error('Failed to fetch location name');
        }
        const data = await response.json();
        setLocationName(data.display_name || 'Could not determine location name.');
      } catch (error) {
        console.error("Reverse geocoding error:", error);
        setLocationName('Location name unavailable.');
      } finally {
        setIsGeocoding(false);
      }
    }, 500);

    return () => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
    }
  }, [location]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
        alert("Please provide a description.");
        return;
    }
    if (description.trim().length < 10) {
        alert("Description must be at least 10 characters long.");
        return;
    }
    if (!location) {
        setLocationError(t('reportForm.locationError'));
        return;
    }
    
    setIsSubmitting(true);
    setLocationError(null);

    const reportData = { 
      hazard, 
      description: description.trim(), 
      location: { 
        lat: location.lat, 
        lng: location.lng, 
        name: locationName || "User Reported Location" 
      }, 
      image 
    };

    console.log('🐛 DEBUG: ReportForm submitting data:', reportData);

    try {
      await onSubmit(reportData);
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error('🐛 DEBUG: ReportForm submission error:', error);
      setIsSubmitting(false);
    }
  };

  return (
    <Modal title={t('reportForm.title')} onClose={onClose} className="max-w-3xl">
      <form onSubmit={handleSubmit}>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-300 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
            <div>
              <label htmlFor="hazard-type" className="block text-sm font-medium mb-1">{t('reportForm.hazardTypeLabel')}</label>
              <select
                id="hazard-type"
                value={hazard}
                onChange={(e) => setHazard(e.target.value as HazardType)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              >
                {HAZARD_TYPES.map(type => <option key={type} value={type}>{t(`hazards.${type.replace(/\s/g, '')}`)}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1">{t('reportForm.descriptionLabel')}</label>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                placeholder={t('reportForm.descriptionPlaceholder')}
              />
            </div>
            <div>
              <label htmlFor="image-upload" className="block text-sm font-medium mb-1">{t('reportForm.photoLabel')}</label>
              <input
                type="file"
                id="image-upload"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-sky-600 file:text-white hover:file:bg-sky-700"
              />
              {image && <img src={image} alt="Preview" className="mt-4 rounded-md max-h-40 w-full object-cover"/>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t('reportForm.locationLabel')}</label>
            <div className="h-80 w-full rounded-lg overflow-hidden border border-slate-600">
                <LocationPicker onLocationChange={setLocation} />
            </div>
             {location && (
                <div className="text-xs text-slate-300 mt-2 p-2 bg-slate-700/50 rounded">
                    <p className="font-semibold">{t('reportForm.coordinates')}: <span className="text-green-400 font-mono">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span></p>
                    <p className="font-semibold mt-1">{t('reportForm.geocodedLocation')}: 
                        <span className="text-sky-300 ml-1">
                            {isGeocoding ? t('reportForm.fetchingLocation') : locationName || 'N/A'}
                        </span>
                    </p>
                </div>
            )}
             {locationError && (
                <p className="text-xs text-red-400 mt-2">{locationError}</p>
            )}
          </div>
        </div>
        <div className="bg-slate-800 px-6 py-3 flex justify-end gap-3 rounded-b-lg border-t border-slate-700">
          <Button type="button" onClick={onClose} variant="secondary" disabled={isSubmitting}>{t('reportForm.cancel')}</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : <ion-icon name="send-outline" className="mr-2"></ion-icon>}
            {t('reportForm.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReportForm;
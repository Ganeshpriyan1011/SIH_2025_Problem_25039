
import React, { useEffect, useRef } from 'react';
// FIX: Imported 'leaflet' to resolve "'L' refers to a UMD global" error.
import L from 'leaflet';

interface LocationPickerProps {
    onLocationChange: (location: { lat: number; lng: number }) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ onLocationChange }) => {
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        if (!mapRef.current) {
            const map = L.map('location-picker-map', {
                center: [20.5937, 78.9629],
                zoom: 5,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
            }).addTo(map);

            const markerIcon = L.divIcon({
                html: `<ion-icon name="location" class="text-sky-400 text-5xl" style="transform: translate(-16px, -32px);"></ion-icon>`,
                className: '',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            });
            
            const initialLatLng = map.getCenter();
            const marker = L.marker(initialLatLng, { icon: markerIcon, draggable: true }).addTo(map);

            marker.on('dragend', function(event){
                var marker = event.target;
                var position = marker.getLatLng();
                if(isMounted.current) {
                    onLocationChange({ lat: position.lat, lng: position.lng });
                }
            });

            map.on('click', function(e) {
                marker.setLatLng(e.latlng);
                if(isMounted.current) {
                    onLocationChange({ lat: e.latlng.lat, lng: e.latlng.lng });
                }
            });
            
            mapRef.current = map;
            markerRef.current = marker;

            // Initial call
            onLocationChange({ lat: initialLatLng.lat, lng: initialLatLng.lng });

            setTimeout(() => {
                if(mapRef.current) {
                    mapRef.current.invalidateSize();
                }
            }, 100);
        }

        return () => {
            isMounted.current = false;
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, [onLocationChange]);

    return (
        <div id="location-picker-map" className="w-full h-full" />
    );
};

export default LocationPicker;

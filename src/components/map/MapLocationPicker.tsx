import React, { useState, useEffect, useRef } from 'react';
import { ApiLocation } from '@/services/api';

// Leaflet is loaded via CDN in index.html
declare const L: any;

interface MapLocationPickerProps {
    onSave: (location: { name: string; address: string; latitude: number; longitude: number }) => Promise<void>;
    onCancel: () => void;
    initialLat?: number;
    initialLng?: number;
    initialAddress?: string;
    initialName?: string;
    saveLabel?: string;
}

const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
    onSave,
    onCancel,
    initialLat = 41.2995,
    initialLng = 69.2401,
    initialAddress = '',
    initialName = '',
    saveLabel = "Saqlash"
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    const [lat, setLat] = useState(initialLat);
    const [lng, setLng] = useState(initialLng);
    const [address, setAddress] = useState(initialAddress);
    const [name, setName] = useState(initialName);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // --- Reverse Geocode (Coords -> Address) ---
    const reverseGeocode = async (latitude: number, longitude: number) => {
        setIsGeocoding(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=uz`
            );
            const data = await res.json();
            if (data.display_name) {
                setAddress(data.display_name);
            }
        } catch (err) {
            console.error('Reverse geocoding failed', err);
        } finally {
            setIsGeocoding(false);
        }
    };

    // --- Forward Geocode (Address -> Coords) ---
    // Debounced search for manual address entry
    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (!searchQuery || searchQuery.length < 3) return;

            setIsGeocoding(true);
            try {
                // Limit to Uzbekistan for better relevance
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&countrycodes=uz&limit=1&accept-language=uz`
                );
                const data = await res.json();
                if (data && data.length > 0) {
                    const newLat = parseFloat(data[0].lat);
                    const newLng = parseFloat(data[0].lon);

                    setLat(newLat);
                    setLng(newLng);
                    setAddress(data[0].display_name);

                    // Move map
                    if (mapInstanceRef.current) {
                        mapInstanceRef.current.setView([newLat, newLng], 15);
                        if (markerRef.current) {
                            markerRef.current.setLatLng([newLat, newLng]);
                        }
                    }
                }
            } catch (err) {
                console.error('Forward geocoding failed', err);
            } finally {
                setIsGeocoding(false);
            }
        }, 1000); // 1.5s debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);


    // --- Live Geolocation ---
    const handleLiveGeo = () => {
        if (!navigator.geolocation) {
            alert("Geolokatsiya qo'llab-quvvatlanmaydi");
            return;
        }

        setIsGeocoding(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLat(latitude);
                setLng(longitude);

                // Move map
                if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([latitude, longitude], 15);
                    if (markerRef.current) {
                        markerRef.current.setLatLng([latitude, longitude]);
                    }
                }

                // Update address
                reverseGeocode(latitude, longitude);
            },
            (error) => {
                console.error("Geolocation error:", error);
                alert("Geolokatsiyani aniqlab bo'lmadi. Ruxsat berilganligini tekshiring.");
                setIsGeocoding(false);
            },
            { enableHighAccuracy: true }
        );
    };

    // --- Map Initialization ---
    useEffect(() => {
        if (!mapRef.current) return;
        if (mapInstanceRef.current) return; // Already initialized

        if (typeof L === 'undefined') {
            console.error('Leaflet not loaded');
            return;
        }

        // Initialize Map
        const map = L.map(mapRef.current).setView([lat, lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Custom Icon
        const icon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Draggable Marker
        const marker = L.marker([lat, lng], { draggable: true, icon }).addTo(map);
        markerRef.current = marker;

        marker.on('dragend', (e: any) => {
            const { lat: newLat, lng: newLng } = e.target.getLatLng();
            setLat(newLat);
            setLng(newLng);
            reverseGeocode(newLat, newLng);
        });

        map.on('click', (e: any) => {
            const { lat: newLat, lng: newLng } = e.latlng;
            marker.setLatLng([newLat, newLng]);
            setLat(newLat);
            setLng(newLng);
            reverseGeocode(newLat, newLng);
        });

        mapInstanceRef.current = map;

        // Cleanup
        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, []); // Run once

    // Sync external props if needed? No, internal state handles interaction.

    const handleSaveClick = async () => {
        if (!name.trim()) {
            alert("Iltimos, manzilga nom bering (masalan: Uy, Ishxona)");
            return;
        }
        setIsSaving(true);
        try {
            await onSave({
                name: name.trim(),
                address: address || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
                latitude: lat,
                longitude: lng
            });
        } catch (err: any) {
            alert(err?.message || "Saqlashda xatolik yuz berdi");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col pt-safe-top">
            {/* Header */}
            <div className="shrink-0 p-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                <h2 className="text-lg font-bold">Xaritadan belgilash</h2>
                <button
                    onClick={onCancel}
                    className="p-2 bg-gray-100 rounded-full min-h-[44px] min-w-[44px]"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative min-h-0">
                <div ref={mapRef} className="w-full h-full z-0" />

                {/* Live Geo Button */}
                <button
                    onClick={handleLiveGeo}
                    className="absolute bottom-6 right-6 z-[400] bg-white p-3 min-h-[44px] min-w-[44px] rounded-full shadow-lg active:scale-95 transition-transform flex items-center justify-center"
                    title="Mening joylashuvim"
                >
                    <span className="material-symbols-outlined text-primary">my_location</span>
                </button>
            </div>

            {/* Bottom Form */}
            <div className="shrink-0 p-4 bg-white border-t border-gray-100 shadow-xl z-20 pb-safe-bottom overflow-y-auto max-h-[55vh]" style={{ WebkitOverflowScrolling: 'touch' }}>
                <div className="space-y-4">
                    {/* Manual Address Input (Forward Geo) */}
                    <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1">Manzilni qidirish</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Manzilni kiriting (masalan: Toshkent, Chorsu)..."
                                className="w-full bg-gray-50 border-none rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary min-h-[44px]"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-3 text-gray-400">search</span>
                            {isGeocoding && (
                                <div className="absolute right-3 top-3 size-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                    </div>

                    {/* Detected Address */}
                    <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1">Aniqlangan manzil</label>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-dashed border-gray-200">
                            {address || "Manzil tanlanmagan"}
                        </p>
                    </div>

                    {/* Location Name */}
                    <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1">Manzil nomi</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Masalan: Uy, Ishxona, Do'kon"
                            className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary min-h-[44px]"
                        />
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSaveClick}
                        disabled={isSaving || isGeocoding}
                        className="w-full bg-primary text-white font-bold py-4 rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                        {isSaving ? (
                            <>
                                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Saqlanmoqda...
                            </>
                        ) : (
                            saveLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MapLocationPicker;

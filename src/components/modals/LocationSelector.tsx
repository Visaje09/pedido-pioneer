import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, MapPin, Save } from 'lucide-react';
import { toast } from 'sonner';

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    address: string;
    latitude: number;
    longitude: number;
  }) => void;
  initialAddress?: string;
}

interface SearchResult {
  place_name: string;
  center: [number, number];
}

export function LocationSelector({ 
  isOpen, 
  onClose, 
  onLocationSelect, 
  initialAddress = '' 
}: LocationSelectorProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  
  const [searchQuery, setSearchQuery] = useState(initialAddress);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!isOpen || !mapContainer.current) return;

    // Get Mapbox token from environment
    const MAPBOX_TOKEN = 'pk.eyJ1IjoibG92YWJsZSIsImEiOiJjbTNkZjBiZHcxMGtpMnFxeWx4YjJsOThxIn0.MIGmOKBtPxG8P5UzGJOhWw'; // Temporary token - should be from secrets
    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-74.006, 40.7128], // Default to NYC
      zoom: 13,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Handle map clicks
    map.current.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      updateMarkerPosition(lng, lat);
      
      // Reverse geocode to get address
      reverseGeocode(lng, lat);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isOpen]);

  const updateMarkerPosition = useCallback((lng: number, lat: number) => {
    if (!map.current) return;

    // Remove existing marker
    if (marker.current) {
      marker.current.remove();
    }

    // Add new marker
    marker.current = new mapboxgl.Marker({ 
      color: '#ef4444',
      draggable: true 
    })
      .setLngLat([lng, lat])
      .addTo(map.current);

    // Handle marker drag
    marker.current.on('dragend', () => {
      if (marker.current) {
        const lngLat = marker.current.getLngLat();
        reverseGeocode(lngLat.lng, lngLat.lat);
      }
    });
  }, []);

  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        setSelectedLocation({
          address,
          latitude: lat,
          longitude: lng
        });
        setSearchQuery(address);
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      toast.error('Error obteniendo la dirección');
    }
  };

  const searchAddresses = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&country=co&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setSearchResults(data.features);
      }
    } catch (error) {
      console.error('Error searching addresses:', error);
      toast.error('Error buscando direcciones');
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: SearchResult) => {
    const [lng, lat] = result.center;
    
    setSearchQuery(result.place_name);
    setSearchResults([]);
    setSelectedLocation({
      address: result.place_name,
      latitude: lat,
      longitude: lng
    });

    // Move map to location
    if (map.current) {
      map.current.flyTo({
        center: [lng, lat],
        zoom: 16
      });
    }

    updateMarkerPosition(lng, lat);
  };

  const handleSaveLocation = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
      toast.success('Ubicación guardada correctamente');
    } else {
      toast.error('Por favor selecciona una ubicación');
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    searchAddresses(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Seleccionar Ubicación de Despacho
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Label htmlFor="search-address">Buscar dirección</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="search-address"
                type="text"
                placeholder="Buscar dirección..."
                value={searchQuery}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <button
                    key={index}
                    onClick={() => selectSearchResult(result)}
                    className="w-full text-left px-3 py-2 hover:bg-muted border-b last:border-b-0 text-sm"
                  >
                    {result.place_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="flex-1 relative border rounded-lg overflow-hidden min-h-[400px]">
            <div ref={mapContainer} className="w-full h-full" />
            
            {/* Map Instructions */}
            <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-2 rounded-md shadow-sm text-sm">
              <p className="font-medium">Instrucciones:</p>
              <p>• Busca una dirección arriba</p>
              <p>• O haz clic en el mapa para seleccionar</p>
              <p>• Arrastra el marcador para ajustar</p>
            </div>
          </div>

          {/* Selected Location Display */}
          {selectedLocation && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <Label className="text-sm font-medium">Ubicación seleccionada:</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedLocation.address}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Lat: {selectedLocation.latitude.toFixed(6)}, 
                Lng: {selectedLocation.longitude.toFixed(6)}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveLocation}
              disabled={!selectedLocation}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Guardar Ubicación
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
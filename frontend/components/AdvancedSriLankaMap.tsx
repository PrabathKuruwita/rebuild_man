"use client";

import { useEffect, useRef, useState } from "react";
import { Organization } from "@/lib/api";
import "leaflet/dist/leaflet.css";

type LeafletMap = {
  fitBounds: (
    bounds: unknown,
    options?: { padding?: [number, number]; maxZoom?: number; animate?: boolean },
  ) => void;
  off: () => void;
  remove: () => void;
  stop?: () => void;
};

let L: typeof import("leaflet") | null = null;

const initLeaflet = async () => {
  if (!L) {
    L = await import("leaflet");
  }
  return L;
};

interface AdvancedSriLankaMapProps {
  organizations?: Organization[];
}

const districtCoordinates: Record<string, [number, number]> = {
  colombo: [6.9271, 79.8612],
  gampaha: [7.0917, 79.9999],
  kalutara: [6.5854, 79.9607],
  kandy: [7.2906, 80.6337],
  matale: [7.4675, 80.6234],
  nuwaraeliya: [6.9497, 80.7891],
  nuwaraeliyaalt: [6.9497, 80.7891],
  galle: [6.0535, 80.221],
  matara: [5.9549, 80.555],
  hambantota: [6.1241, 81.1185],
  jaffna: [9.6615, 80.0255],
  kilinochchi: [9.3803, 80.377],
  mannar: [8.977, 79.904],
  mullaitivu: [9.2673, 80.8135],
  vavuniya: [8.7514, 80.4971],
  batticaloa: [7.717, 81.7001],
  ampara: [7.2917, 81.6747],
  trincomalee: [8.5874, 81.2152],
  kurunegala: [7.4863, 80.3647],
  puttalam: [8.033, 79.8262],
  anuradhapura: [8.3114, 80.4037],
  polonnaruwa: [7.94, 81.0188],
  badulla: [6.9934, 81.055],
  monaragala: [6.8721, 81.3507],
  ratnapura: [6.6828, 80.3992],
  kegalle: [7.2513, 80.3464],
};

const normalizeDistrictKey = (district: string): string =>
  district.toLowerCase().replace(/[^a-z]/g, "");

export default function AdvancedSriLankaMap({
  organizations = [],
}: AdvancedSriLankaMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mappedOrganizations, setMappedOrganizations] = useState(0);

  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      if (!mapContainer.current || map.current) {
        return;
      }

      const container = mapContainer.current;

      try {
        const LeafletLib = await initLeaflet();

        if (isCancelled || map.current) {
          return;
        }

        // In React Strict Mode, effects can run twice in development.
        // Reset previous Leaflet binding on the same DOM node before creating a new map.
        const leafletContainer = container as HTMLElement & {
          _leaflet_id?: number;
        };
        if (leafletContainer._leaflet_id) {
          leafletContainer._leaflet_id = undefined;
          container.innerHTML = "";
        }

        // Initialize map
        map.current = LeafletLib.map(container, {
          preferCanvas: true,
          attributionControl: true,
          zoomControl: true,
          zoomAnimation: false,
          fadeAnimation: false,
          markerZoomAnimation: false,
          dragging: !LeafletLib.Browser.mobile,
          tap: !LeafletLib.Browser.mobile,
          scrollWheelZoom: false,
          maxBounds: [[5.5, 79.5], [10.0, 82.0]],
          maxBoundsViscosity: 1.0,
        }).setView([7.8731, 80.7718], 8);

        // Add OpenStreetMap tile layer (faster and more reliable)
        LeafletLib.tileLayer(
          "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            attribution: "&copy; OpenStreetMap contributors",
            maxZoom: 19,
            minZoom: 6,
          },
        ).addTo(map.current);

        // Fix Leaflet marker icons
        LeafletLib.Icon.Default.mergeOptions({
          iconRetinaUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
          iconUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          shadowUrl:
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
        });

        const organizationsWithCoordinates = organizations
          .map((organization) => {
            if (
              organization.latitude !== undefined &&
              organization.latitude !== null &&
              organization.longitude !== undefined &&
              organization.longitude !== null
            ) {
              return {
                organization,
                lat: Number(organization.latitude),
                lng: Number(organization.longitude),
              };
            }

            const districtKey = normalizeDistrictKey(
              organization.district || "",
            );
            const location = districtCoordinates[districtKey];
            if (!location) {
              return null;
            }

            return {
              organization,
              lat: location[0],
              lng: location[1],
            };
          })
          .filter(
            (
              entry,
            ): entry is {
              organization: Organization;
              lat: number;
              lng: number;
            } => entry !== null,
          );

        // Add markers only for registered organizations
        organizationsWithCoordinates.forEach((entry) => {
          const customIcon = LeafletLib.divIcon({
            className: "custom-map-marker bg-transparent border-none",
            html: `
              <div class="relative flex items-center justify-center w-8 h-8">
                <div class="absolute inset-0 bg-primary/30 rounded-full animate-pulse-ring z-0"></div>
                <div class="relative bg-white rounded-full p-1.5 shadow-md border border-primary/20 flex items-center justify-center z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-rose-500 fill-rose-500/20">
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                  </svg>
                </div>
              </div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16],
          });

          const marker = LeafletLib.marker([entry.lat, entry.lng], {
            title: entry.organization.name,
            icon: customIcon,
          }).addTo(map.current);

          const popupContent = `
            <div style="padding: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; width: 200px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af; font-size: 13px;">${entry.organization.name}</h3>
              <hr style="margin: 8px 0; border: none; border-top: 1px solid #e5e7eb;">
              <div style="font-size: 12px; color: #374151; line-height: 1.6;">
                <p style="margin: 4px 0;"><strong>District:</strong> ${entry.organization.district}</p>
                <p style="margin: 4px 0;"><strong>Type:</strong> ${entry.organization.org_type || "OTHER"}</p>
                <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #16a34a; font-weight: 600;">Registered</span></p>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent, { maxWidth: 250, maxHeight: 200, closeButton: false, offset: [0, -10] });
          marker.on("mouseover", () => marker.openPopup());
          marker.on("mouseout", () => marker.closePopup());
          marker.on("click", () => marker.openPopup());
        });

        if (organizationsWithCoordinates.length > 0) {
          const bounds = LeafletLib.latLngBounds(
            organizationsWithCoordinates.map((entry) => [entry.lat, entry.lng]),
          );
          const leafletMap = map.current;
          if (leafletMap) {
            leafletMap.fitBounds(bounds, {
              padding: [30, 30],
              maxZoom: 9,
              animate: false,
            });
          }
        }

        setMappedOrganizations(organizationsWithCoordinates.length);

        setMapError(null);
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError("Map failed to load. Please refresh the page.");
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      isCancelled = true;
      if (map.current) {
        try {
          if (typeof map.current.stop === "function") {
            map.current.stop();
          }
          map.current.off();
          map.current.remove();
        } catch (err) {
          console.error("Error during map cleanup:", err);
        }
        map.current = null;
      }
    };
  }, [organizations]);

  return (
    <div className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative">
      <div ref={mapContainer} style={{ height: "100%", width: "100%" }} />

      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-700 flex items-center justify-center z-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-white mx-auto mb-3"></div>
            <p className="text-sm font-medium">Loading Sri Lanka Map...</p>
            <p className="text-xs text-blue-100 mt-1">
              Initializing 9 hospital locations
            </p>
          </div>
        </div>
      )}

      {mapError && !isLoading && (
        <div className="absolute inset-0 bg-red-50/95 flex items-center justify-center z-50">
          <div className="text-center px-4">
            <p className="text-sm font-semibold text-red-700">{mapError}</p>
            <p className="text-xs text-red-600 mt-1">
              Check network access to OpenStreetMap tiles.
            </p>
          </div>
        </div>
      )}

      {/* Map Legend Overlay */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 z-40 max-w-xs pointer-events-auto hover:shadow-xl transition-shadow cursor-default">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-sm font-bold text-gray-900">
            ORGANIZATION MAP
          </span>
        </div>
        <div className="space-y-2 text-xs text-gray-700 font-medium">
          <p>{mappedOrganizations} registered organizations</p>
          <p>Click markers for details</p>
          <p>Drag to pan, scroll to zoom</p>
        </div>
      </div>

      {mappedOrganizations === 0 && !isLoading && !mapError && (
        <div className="absolute bottom-4 left-4 bg-white/95 rounded-lg shadow-lg px-4 py-2 z-40 backdrop-blur-sm">
          <span className="text-xs font-semibold text-gray-900">
            No registered organizations yet. Markers will appear after
            registration.
          </span>
        </div>
      )}
    </div>
  );
}

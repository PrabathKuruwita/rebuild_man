"use client";

import { useEffect, useRef, useState } from "react";
import type { Marker } from "leaflet";
import { Organization } from "@/lib/api";
import "leaflet/dist/leaflet.css";

type LeafletMap = {
  fitBounds: (
    bounds: unknown,
    options?: { padding?: [number, number]; maxZoom?: number; animate?: boolean },
  ) => void;
  panTo?: (latlng: [number, number], options?: { animate?: boolean; duration?: number }) => void;
  invalidateSize?: (options?: boolean | { animate?: boolean }) => void;
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
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const hasAnimatedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mappedOrganizations, setMappedOrganizations] = useState(0);

  // 1. Observe when map container enters viewport on scroll
  useEffect(() => {
    const wrapper = mapWrapperRef.current;
    if (!wrapper) return;

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setIsInView(true);
              setHasEnteredView(true);
              observer.disconnect();
              break;
            }
          }
        },
        { threshold: 0.15 }
      );
      observer.observe(wrapper);
      return () => observer.disconnect();
    } else {
      const handleScroll = () => {
        const rect = wrapper.getBoundingClientRect();
        if (rect.top <= window.innerHeight * 0.85 && rect.bottom >= 0) {
          setIsInView(true);
          setHasEnteredView(true);
          window.removeEventListener("scroll", handleScroll);
        }
      };
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  // 2. Initialize base Leaflet map and tiles
  useEffect(() => {
    let isCancelled = false;

    const initMap = async () => {
      if (!mapContainer.current || map.current) {
        return;
      }

      const container = mapContainer.current;

      try {
        const LeafletLib = await initLeaflet();
        leafletRef.current = LeafletLib;

        if (isCancelled || map.current) {
          return;
        }

        // In React Strict Mode, reset previous Leaflet binding if any
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
          zoomAnimation: true,
          dragging: true,
          tap: false,
          touchZoom: true,
          scrollWheelZoom: false,
          maxBounds: [[5.5, 79.5], [10.0, 82.0]],
          maxBoundsViscosity: 1.0,
        }).setView([7.8731, 80.7718], 8);

        // Add OpenStreetMap tile layer
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

        setIsMapReady(true);
        setTimeout(() => {
          if (map.current && typeof map.current.invalidateSize === "function") {
            map.current.invalidateSize();
          }
        }, 150);
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
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
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
  }, []);

  // 3. Sequential Pop-Up Animation: triggered when user scrolls down and sees the map card
  useEffect(() => {
    if (!isMapReady || !isInView || !map.current || !leafletRef.current) return;
    if (hasAnimatedRef.current) return;
    hasAnimatedRef.current = true;

    const LeafletLib = leafletRef.current;

    // Clear any previous markers or timeouts
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];

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

        const districtKey = normalizeDistrictKey(organization.district || "");
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

    // Sort strictly by registration order (ID ascending: first registered appears first)
    const sortedOrgs = [...organizationsWithCoordinates].sort(
      (a, b) => (a.organization.id || 0) - (b.organization.id || 0)
    );

    if (map.current && typeof map.current.invalidateSize === "function") {
      map.current.invalidateSize();
    }

    if (sortedOrgs.length > 0 && map.current) {
      const bounds = LeafletLib.latLngBounds(
        sortedOrgs.map((entry) => [entry.lat, entry.lng]),
      );
      map.current.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 9,
        animate: true,
      });
    }

    // Add hearts ONE BY ONE with spring pop-up animation and expanding shockwave ripple
    sortedOrgs.forEach((entry, index) => {
      const delay = 400 + index * 600; // Staggered pop-up: 400ms, 1000ms, 1600ms...
      const timeoutId = setTimeout(() => {
        if (!map.current) return;

        const customIcon = LeafletLib.divIcon({
          className: "custom-map-marker bg-transparent border-none",
          html: `
            <div class="heart-marker-spring" style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;" title="${entry.organization.name} (#${index + 1} Registered)">
              <!-- Expanding Ping Ripple Wave -->
              <div class="heart-ping-wave" style="position: absolute; inset: -4px; border-radius: 9999px; background: radial-gradient(circle, rgba(244, 63, 94, 0.6) 0%, rgba(13, 148, 136, 0.25) 55%, transparent 75%); pointer-events: none;"></div>
              
              <!-- Circular White Badge -->
              <div style="position: relative; z-index: 10; width: 34px; height: 34px; background: #ffffff; border-radius: 9999px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16), 0 2px 6px rgba(244, 63, 94, 0.2); border: 2.5px solid #0d9488; transition: transform 0.2s ease;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#f43f5e" stroke="#e11d48" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="heart-beat-svg" style="display: block; transform-origin: center;">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                </svg>
              </div>

              <!-- Sequence Order Chip (#1, #2) -->
              <span style="position: absolute; top: -3px; right: -3px; z-index: 20; background: #0d9488; color: #ffffff; font-size: 10px; font-weight: 800; width: 18px; height: 18px; border-radius: 9999px; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.25); line-height: 1;">
                ${index + 1}
              </span>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22],
          popupAnchor: [0, -24],
        });

        const googleMapsQuery = entry.organization.name
          ? `${entry.organization.name}, ${entry.organization.address ? entry.organization.address + ", " : ""}${entry.organization.district ? entry.organization.district + ", " : ""}Sri Lanka`
          : `${entry.lat},${entry.lng}`;
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(googleMapsQuery)}`;

        const marker = LeafletLib.marker([entry.lat, entry.lng], {
          title: `${entry.organization.name} (#${index + 1} Registered)`,
          icon: customIcon,
        }).addTo(map.current);

        markersRef.current.push(marker);

        const popupContent = `
          <div style="padding: 14px 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; width: 100%; max-width: 260px; box-sizing: border-box;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              <span style="background: #f0fdf4; color: #16a34a; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 9999px; border: 1px solid #bbf7d0; text-transform: uppercase; letter-spacing: 0.05em;">
                Registered #${index + 1}
              </span>
              <span style="font-size: 11px; color: #64748b; font-weight: 500;">
                Verified Org
              </span>
            </div>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="font-weight: 700; color: #0f172a; font-size: 14px; text-decoration: none; display: flex; align-items: flex-start; justify-content: space-between; gap: 6px; line-height: 1.35; margin-bottom: 8px;" title="Open in Google Maps">
              <span>${entry.organization.name}</span>
              <span style="color: #0d9488; font-size: 13px;">↗</span>
            </a>
            <hr style="margin: 8px 0; border: none; border-top: 1px solid #f1f5f9;">
            <div style="font-size: 12px; color: #334155; line-height: 1.6;">
              <p style="margin: 3px 0; display: flex; justify-content: space-between;"><strong style="color: #64748b;">District:</strong> <span style="font-weight: 600;">${entry.organization.district || "N/A"}</span></p>
              <p style="margin: 3px 0; display: flex; justify-content: space-between;"><strong style="color: #64748b;">Category:</strong> <span style="font-weight: 600;">${entry.organization.org_type || "HOSPITAL"}</span></p>
              <p style="margin: 3px 0; display: flex; justify-content: space-between;"><strong style="color: #64748b;">Status:</strong> <span style="color: #0d9488; font-weight: 700;">Active Partner</span></p>
            </div>
            <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer"
               style="display: flex; align-items: center; justify-content: center; gap: 7px; width: 100%; margin-top: 12px; padding: 8px 12px; background: #0d9488; color: #ffffff; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 600; box-shadow: 0 2px 6px rgba(13,148,136,0.3); cursor: pointer; box-sizing: border-box; transition: background 0.2s ease;">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Open in Google Maps
            </a>
          </div>
        `;

        marker.bindPopup(popupContent, {
          maxWidth: 280,
          minWidth: 240,
          closeButton: true,
          autoPan: true,
          autoPanPadding: [30, 30],
          offset: [0, -12],
        });

        marker.on("mouseover", () => marker.openPopup());
        marker.on("click", () => {
          if (map.current && typeof map.current.panTo === "function") {
            map.current.panTo([entry.lat, entry.lng], { animate: true, duration: 0.3 });
          }
          marker.openPopup();
        });

        // Live count update
        setMappedOrganizations(index + 1);
      }, delay);

      timeoutsRef.current.push(timeoutId);
    });
  }, [isMapReady, isInView, organizations]);

  return (
    <div ref={mapWrapperRef} className="w-full h-full rounded-xl overflow-hidden shadow-2xl relative">
      <style>{`
        @keyframes heart-marker-spring-popup {
          0% {
            opacity: 0;
            transform: scale(0) translateY(32px);
          }
          55% {
            opacity: 1;
            transform: scale(1.4) translateY(-10px);
          }
          75% {
            transform: scale(0.88) translateY(3px);
          }
          90% {
            transform: scale(1.1) translateY(-1px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes heart-ping-ripple {
          0% {
            transform: scale(0.6);
            opacity: 0.95;
          }
          100% {
            transform: scale(3.2);
            opacity: 0;
          }
        }

        @keyframes heart-alive-pulse {
          0%, 100% {
            transform: scale(1);
          }
          20% {
            transform: scale(1.15);
          }
          40% {
            transform: scale(1);
          }
          60% {
            transform: scale(1.18);
          }
          80% {
            transform: scale(1);
          }
        }

        .heart-marker-spring {
          animation: heart-marker-spring-popup 0.75s cubic-bezier(0.34, 1.56, 0.64, 1) forwards !important;
        }
        .heart-ping-wave {
          animation: heart-ping-ripple 1.4s ease-out 1 forwards !important;
        }
        .heart-beat-svg {
          animation: heart-alive-pulse 2.8s ease-in-out infinite 0.75s !important;
        }
      `}</style>
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

      {/* High-Contrast Floating Legend Overlay with Slide-In Animation - PERMANENTLY VISIBLE & FULLY RESPONSIVE */}
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        onDoubleClick={(e) => e.stopPropagation()}
        className={`absolute top-3 right-3 sm:top-5 sm:right-5 z-[1200] max-w-[210px] xs:max-w-[240px] sm:max-w-[270px] pointer-events-auto transition-all duration-700 ease-out will-change-transform ${
          hasEnteredView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12 pointer-events-none"
        }`}
        style={{ 
          transitionDelay: "300ms",
          transform: hasEnteredView ? "translate3d(0, 0, 0)" : "translate3d(48px, 0, 0)",
        }}
      >
        <div className="bg-slate-900/95 backdrop-blur-md rounded-xl p-2.5 sm:p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)] border border-slate-700/70 text-white relative overflow-hidden select-none">
          {/* Subtle accent glow line at the top */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500"></div>

          <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-2 sm:mb-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="relative flex h-2 w-2 sm:h-2.5 sm:w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 sm:h-2.5 sm:w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] xs:text-[10px] sm:text-[11px] font-bold tracking-wider uppercase text-emerald-400 font-label truncate">
                Live Network Map
              </span>
            </div>
            
            <span className="bg-emerald-500/15 text-emerald-400 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full border border-emerald-500/30 tabular-nums shrink-0">
              {mappedOrganizations > 0 ? mappedOrganizations : organizations.length} Active
            </span>
          </div>

          <div className="space-y-1 sm:space-y-1.5 text-[10px] sm:text-xs">
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-200 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0"></span>
              <span className="truncate">
                <strong className="text-white font-bold">{mappedOrganizations > 0 ? mappedOrganizations : organizations.length}</strong> verified organizations
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[9px] sm:text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
              <span className="truncate">Tap heart markers for details</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[9px] sm:text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0"></span>
              <span className="truncate">Click popup for Google Maps</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

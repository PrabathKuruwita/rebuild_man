declare module "leaflet" {
  export interface Marker {
    bindPopup(content: any, options?: any): this;
    openPopup(): this;
    on(type: string, fn: (...args: any[]) => void): this;
    addTo(map: any): this;
    remove(): this;
    [key: string]: any;
  }

  const Leaflet: any;
  export default Leaflet;
  export = Leaflet;
}

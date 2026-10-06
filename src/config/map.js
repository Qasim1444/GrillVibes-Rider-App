export const MAP_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors"
    }
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm"
    }
  ]
};

export const ACTIVE_DELIVERY_STATUSES = ["accepted", "picked_up", "on_way"];
export const STOPPED_DELIVERY_STATUSES = ["delivered", "rejected", "cancelled"];
export const ROUTE_REFRESH_MS = 20000;
export const DEFAULT_MAP_CENTER = [72.3489, 30.0452];

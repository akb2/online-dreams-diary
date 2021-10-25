import { MapTerrain } from "@_models/dream";





// Перечисления типов местности
export const MapTerrains: MapTerrain[] = ([
  {
    id: 1,
    name: "Трава",
    undergroundImage: "",
  }
]).map(t => ({
  ...t,
  backgroundImage: "../../assets/images/map/terrain/background/" + t.id + ".jpg",
  undergroundImage: "../../assets/images/map/terrain/underground/" + t.id + ".jpg",
  undergroundBorderImage: "../../assets/images/map/terrain/border/z/" + t.id + ".jpg"
}));
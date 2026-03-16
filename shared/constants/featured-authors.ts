// Featured authors from legacy project with hardcoded kit mappings
import { SITE_URL } from "./site";

export type FeaturedAuthor = {
  user_name: string;
  user_namespace: string;
  user_avatar_source?: string;
  kits_description_pattern: string;
  kits: number[];
};

const AVATAR_SRC_PREFIX = "assets/featured-authors";

function createAvatarSrc(name: string) {
  return `${SITE_URL}/${AVATAR_SRC_PREFIX}/${name}.webp`;
}

export const FEATURED_AUTHORS: FeaturedAuthor[] = [
  {
    user_name: "Amatowsky",
    user_namespace: "amatowsky",
    user_avatar_source: createAvatarSrc("amatowsky"),
    kits_description_pattern: "(Original kit by amatowsky)",
    kits: [1],
  },
  {
    user_name: "b.eye",
    user_namespace: "beye",
    user_avatar_source: createAvatarSrc("beye"),
    kits_description_pattern: "(Original kit by beye)",
    kits: [2],
  },
  {
    user_name: "Bryndal",
    user_namespace: "bryndal",
    user_avatar_source: createAvatarSrc("bryndal"),
    kits_description_pattern: "(Original kit by bryndal)",
    kits: [3, 4],
  },
  {
    user_name: "C3B0",
    user_namespace: "c3b0",
    user_avatar_source: createAvatarSrc("c3b0"),
    kits_description_pattern: "(Original kit by C3B0)",
    kits: [5, 6],
  },
  {
    user_name: "Chmielix",
    user_namespace: "chmielix",
    user_avatar_source: createAvatarSrc("chmielix"),
    kits_description_pattern: "(Original kit by chmielix)",
    kits: [7],
  },
  {
    user_name: "DIPPER",
    user_namespace: "dipper",
    user_avatar_source: createAvatarSrc("dipper"),
    kits_description_pattern: "(Original kit by DIPPER)",
    kits: [8],
  },
  {
    user_name: "Endeiks",
    user_namespace: "endeiks",
    user_avatar_source: createAvatarSrc("endeiks"),
    kits_description_pattern: "(Original kit by endeiks)",
    kits: [9],
  },
  {
    user_name: "Freestylecut",
    user_namespace: "freestylecut",
    user_avatar_source: createAvatarSrc("freestylecut"),
    kits_description_pattern: "(Original kit by freestylecut)",
    kits: [10, 11],
  },
  {
    user_name: "Grzana",
    user_namespace: "grzana",
    user_avatar_source: createAvatarSrc("grzana"),
    kits_description_pattern: "(Original kit by grzana)",
    kits: [12],
  },
  {
    user_name: "HAWTCOCO",
    user_namespace: "hawtcoco",
    user_avatar_source: createAvatarSrc("hawtcoco"),
    kits_description_pattern: "(Original kit by hawtcoco)",
    kits: [13],
  },
  {
    user_name: "Jazzgang",
    user_namespace: "jazzgang",
    user_avatar_source: createAvatarSrc("jazzgang"),
    kits_description_pattern: "(Original kit by jazzgang)",
    kits: [14],
  },
  {
    user_name: "KEIZOmachine",
    user_namespace: "keizomachine",
    user_avatar_source: createAvatarSrc("keizomachine"),
    kits_description_pattern: "(Original kit by KEIZOmachine)",
    kits: [15],
  },
  {
    user_name: "Krklive",
    user_namespace: "krklive",
    user_avatar_source: createAvatarSrc("krklive"),
    kits_description_pattern: "(Original kit by krklive)",
    kits: [16],
  },
  {
    user_name: "Lapsky",
    user_namespace: "lapsky",
    user_avatar_source: createAvatarSrc("lapsky"),
    kits_description_pattern: "(Original kit by Lapsky)",
    kits: [17],
  },
  {
    user_name: "Matis",
    user_namespace: "matis",
    user_avatar_source: createAvatarSrc("matis"),
    kits_description_pattern: "(Original kit by Matis)",
    kits: [18],
  },
  {
    user_name: "Małpa",
    user_namespace: "malpa",
    user_avatar_source: createAvatarSrc("malpa"),
    kits_description_pattern: "(Original kit by Małpa)",
    kits: [19, 20],
  },
  {
    user_name: "Mlekobeats",
    user_namespace: "mlekobeats",
    user_avatar_source: createAvatarSrc("mlekobeats"),
    kits_description_pattern: "(Original kit by mlekobeats)",
    kits: [21],
  },
  {
    user_name: "Moskwin",
    user_namespace: "moskwin",
    user_avatar_source: createAvatarSrc("moskwin"),
    kits_description_pattern: "(Original kit by Moskwin)",
    kits: [22],
  },
  {
    user_name: "NANA",
    user_namespace: "nana",
    user_avatar_source: createAvatarSrc("nana"),
    kits_description_pattern: "(Original kit by NANA)",
    kits: [23],
  },
  {
    user_name: "OER",
    user_namespace: "oer",
    user_avatar_source: createAvatarSrc("oer"),
    kits_description_pattern: "(Original kit by oer)",
    kits: [24],
  },
  {
    user_name: "OSKA",
    user_namespace: "oska",
    user_avatar_source: createAvatarSrc("oska"),
    kits_description_pattern: "(Original kit by oska)",
    kits: [25],
  },
  {
    user_name: "Pancho",
    user_namespace: "pancho",
    user_avatar_source: createAvatarSrc("pancho"),
    kits_description_pattern: "(Original kit by pancho)",
    kits: [26],
  },
  {
    user_name: "Pedro le Kraken",
    user_namespace: "pedro-le-kraken",
    user_avatar_source: createAvatarSrc("pedro-le-kraken"),
    kits_description_pattern: "(Original kit by Pedro le Kraken)",
    kits: [27],
  },
  {
    user_name: "Profsk",
    user_namespace: "profsk",
    user_avatar_source: createAvatarSrc("profsk"),
    kits_description_pattern: "(Original kit by profsk)",
    kits: [28],
  },
  {
    user_name: "Resetovski",
    user_namespace: "resetovski",
    user_avatar_source: createAvatarSrc("resetovski"),
    kits_description_pattern: "(Original kit by resetovski)",
    kits: [29, 30],
  },
  {
    user_name: "Rudnik",
    user_namespace: "rudnik",
    user_avatar_source: createAvatarSrc("rudnik"),
    kits_description_pattern: "(Original kit by rudnik)",
    kits: [31],
  },
  {
    user_name: "SamplujeMy",
    user_namespace: "samplujemy",
    user_avatar_source: createAvatarSrc("samplujemy"),
    kits_description_pattern: "(Original kit by SamplujeMy)",
    kits: [32],
  },
  {
    user_name: "SanesMedicine",
    user_namespace: "sanesmedicine",
    user_avatar_source: createAvatarSrc("sanesmedicine"),
    kits_description_pattern: "(Original kit by sanesmedicine)",
    kits: [33],
  },
  {
    user_name: "Steve Nash",
    user_namespace: "steve-nash",
    user_avatar_source: createAvatarSrc("steve-nash"),
    kits_description_pattern: "(Original kit by Steve Nash)",
    kits: [
      34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56,
      57, 58,
    ],
  },
  {
    user_name: "Taico Club",
    user_namespace: "taico-club",
    user_avatar_source: createAvatarSrc("taico-club"),
    kits_description_pattern: "(Original kit by Taico Club)",
    kits: [59],
  },
  {
    user_name: "Tomifuku Kyohei",
    user_namespace: "tomifuku-kyohei",
    user_avatar_source: createAvatarSrc("tomifuku-kyohei"),
    kits_description_pattern: "(Original kit by Tomifuku Kyohei)",
    kits: [60, 61],
  },
  {
    user_name: "Trickflow",
    user_namespace: "trickflow",
    user_avatar_source: createAvatarSrc("trickflow"),
    kits_description_pattern: "(Original kit by Trickflow)",
    kits: [62],
  },
  {
    user_name: "Urbek",
    user_namespace: "urbek",
    user_avatar_source: createAvatarSrc("urbek"),
    kits_description_pattern: "(Original kit by urbek)",
    kits: [63],
  },
  {
    user_name: "SNIK",
    user_namespace: "snik",
    user_avatar_source: createAvatarSrc("snik"),
    kits_description_pattern: "(Original kit by SNIK)",
    kits: [64],
  },
];

export const KIT_TO_AUTHOR_MAP: Map<number, FeaturedAuthor> = (() => {
  const map = new Map<number, FeaturedAuthor>();
  for (const author of FEATURED_AUTHORS) {
    for (const kitId of author.kits) {
      map.set(kitId, author);
    }
  }
  return map;
})();

console.log(KIT_TO_AUTHOR_MAP);

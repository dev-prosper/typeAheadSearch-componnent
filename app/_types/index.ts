export interface Country {
  name: string;
  code: string;
  flag: string;
}

export interface CountryApiItem {
  name: { common: string };
  cca2: string;
  flags: { svg: string; png: string };
}

export interface NormalizedCountry {
  name: string;
  code: string;
  flag: string;
}
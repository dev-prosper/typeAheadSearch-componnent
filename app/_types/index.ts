export interface NormalizedCountry {
  name: string;
  code: string;
  flag: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface Country {
  name: string;
  code: string;
  flag: string;
  currencies: Currency[];
  borders: string[];
}
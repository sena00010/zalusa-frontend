 export type CarrierQuote = {
  id: string; carrier: string; logo: string; logoColor: string; service: string;
  deliveryDays: number; deliveryLabel: string; priceCurrency: string; price: number;
  priceTRY: number; returnCost: number; returnCurrency: string;
  tags: ("recommended" | "fastest" | "cheapest")[];
};

export type SavedAddress = {
  id: string; label: string; name: string; company: string; phone: string;
  address: string; postalCode: string; city: string; country: string;
};

export type PackageItem = {
  id: string;
  widthCm: string;
  lengthCm: string;
  heightCm: string;
  weightKg: string;
  packageCount: string;
  selectedPreset: string;
  saveMeasurement?: boolean;
  measurementLabel?: string;
};

export type ProformaItem = {
  id: string; productDescription: string; hsCode: string; sku: string;
  quantity: string; unitPrice: string; origin: string;
};

export type ShipmentDraft = {
  shipmentName: string; referenceCode: string;
  shipmentType: "Koli" | "Paket" | "Belge"; contentDescription: string;
  hasInsurance: boolean; note: string;
  senderCountry: string; receiverCountry: string; receiverPostalCode: string;

  packages: PackageItem[];

  selectedCarrierId: string; carrierQuotes: CarrierQuote[];

  selectedSenderAddressId: string; selectedReceiverAddressId: string;
  senderName: string; senderCompany: string; senderPhone: string;
  senderAddress: string; senderCity: string; saveSenderAddress: boolean;
  receiverName: string; receiverCompany: string; receiverPhone: string;
  receiverAddress: string; receiverCity: string; receiverStateProvince: string;
  receiverAddressCountry: string; receiverAddressPostalCode: string;
  saveReceiverAddress: boolean;

  // proforma
  proformaDescription: "Normal Gönderi veya Numune" | "Hediye" | "Mikro İhracat (ETGB'li) E-ihracat" | "";
  proformaCurrency: "EUR" | "USD" | "GBP";
  proformaIOSS: string;
  proformaItems: ProformaItem[];

  proformaFileName: string;
};
"use client";

import React from "react";

export type ShipmentDraft = any; // Will be properly imported or refined
export type SavedAddress = {
  id: string; label: string; name: string; company: string; phone: string;
  address: string; postalCode: string; city: string; country: string;
};
export type SavedBankAccount = {
  id: string; label: string; bankName: string; iban: string;
};
export type MeasurementPreset = {
  id: string; label: string; widthCm: string; lengthCm: string; heightCm: string; weightKg: string;
};

// Default initial data for addresses
export const INITIAL_ADDRESSES: SavedAddress[] = [
  { id: "sender-1", label: "Ana Ofis", name: "Zalusa Lojistik", company: "Zalusa Ltd. Şti.", phone: "+90 212 555 0101", address: "Levent Mah. Büyükdere Cad. No:185", postalCode: "34394", city: "Şişli / İstanbul", country: "TR" },
  { id: "sender-2", label: "Depo", name: "Zalusa Depo", company: "Zalusa Ltd. Şti.", phone: "+90 216 555 0202", address: "Organize Sanayi Bölgesi 3. Cadde No:42", postalCode: "34953", city: "Tuzla / İstanbul", country: "TR" },
  { id: "recv-1", label: "Max Müller – Berlin Ofis", name: "Max Müller", company: "Müller GmbH", phone: "+49 30 555 1234", address: "Friedrichstraße 123", postalCode: "10115", city: "Berlin", country: "DE" },
  { id: "recv-2", label: "Anna de Vries – Amsterdam", name: "Anna de Vries", company: "Vries B.V.", phone: "+31 20 555 5678", address: "Keizersgracht 456", postalCode: "1011", city: "Amsterdam", country: "NL" },
  { id: "recv-3", label: "Pierre Dupont – Paris", name: "Pierre Dupont", company: "Dupont SARL", phone: "+33 1 55 55 99 00", address: "12 Rue de Rivoli", postalCode: "75001", city: "Paris", country: "FR" },
];

export const INITIAL_BANK_ACCOUNTS: SavedBankAccount[] = [
  { id: "bank-1", label: "Şirket TL Hesabı", bankName: "Garanti BBVA", iban: "TR12 0006 2000 0001 2345 6789 01" },
];

export const INITIAL_MEASUREMENTS: MeasurementPreset[] = [
  { id: "kucuk-kutu", label: "Küçük Kutu", widthCm: "20", lengthCm: "15", heightCm: "10", weightKg: "1" },
  { id: "orta-kutu", label: "Orta Kutu", widthCm: "40", lengthCm: "30", heightCm: "20", weightKg: "3" },
  { id: "buyuk-kutu", label: "Büyük Kutu", widthCm: "60", lengthCm: "40", heightCm: "40", weightKg: "8" },
  { id: "zarf", label: "Zarf / Döküman", widthCm: "35", lengthCm: "25", heightCm: "3", weightKg: "0.5" },
  { id: "tup-rulo", label: "Tüp / Rulo", widthCm: "80", lengthCm: "15", heightCm: "15", weightKg: "2" },
];

export function useAppState() {
  const [hydrated, setHydrated] = React.useState(false);
  
  const [shipments, setShipments] = React.useState<any[]>([]);
  const [addresses, setAddresses] = React.useState<SavedAddress[]>(INITIAL_ADDRESSES);
  const [bankAccounts, setBankAccounts] = React.useState<SavedBankAccount[]>(INITIAL_BANK_ACCOUNTS);
  const [measurements, setMeasurements] = React.useState<MeasurementPreset[]>(INITIAL_MEASUREMENTS);

  React.useEffect(() => {
    try {
      const s = localStorage.getItem("zalusa.shipments");
      if (s) setShipments(JSON.parse(s));
      
      const a = localStorage.getItem("zalusa.addresses");
      if (a) setAddresses(JSON.parse(a));
      else localStorage.setItem("zalusa.addresses", JSON.stringify(INITIAL_ADDRESSES));

      const b = localStorage.getItem("zalusa.bankAccounts");
      if (b) setBankAccounts(JSON.parse(b));
      else localStorage.setItem("zalusa.bankAccounts", JSON.stringify(INITIAL_BANK_ACCOUNTS));

      const m = localStorage.getItem("zalusa.measurements");
      if (m) setMeasurements(JSON.parse(m));
      else localStorage.setItem("zalusa.measurements", JSON.stringify(INITIAL_MEASUREMENTS));
    } catch {}
    setHydrated(true);
  }, []);

  // Sync to local storage when state changes
  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("zalusa.shipments", JSON.stringify(shipments));
    } catch {}
  }, [shipments, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("zalusa.addresses", JSON.stringify(addresses));
    } catch {}
  }, [addresses, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("zalusa.bankAccounts", JSON.stringify(bankAccounts));
    } catch {}
  }, [bankAccounts, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("zalusa.measurements", JSON.stringify(measurements));
    } catch {}
  }, [measurements, hydrated]);

  return {
    hydrated,
    shipments,
    setShipments,
    addresses,
    setAddresses,
    bankAccounts,
    setBankAccounts,
    measurements,
    setMeasurements,
  };
}

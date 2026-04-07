"use client";

import React from "react";
import { Plus, Trash2, Edit2, MapPin, Building, CreditCard, User, Phone } from "lucide-react";
import { useAppState, SavedAddress, SavedBankAccount } from "@/hooks/useAppState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PanelDataSection() {
  const { hydrated, addresses, setAddresses, bankAccounts, setBankAccounts } = useAppState();

  if (!hydrated) return null;

  function deleteAddress(id: string) {
    setAddresses(prev => prev.filter(a => a.id !== id));
  }

  function deleteBank(id: string) {
    setBankAccounts(prev => prev.filter(b => b.id !== id));
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* ADDRESSES */}
      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Kayıtlı Adreslerim</CardTitle>
          <Button variant="secondary" size="sm" className="h-8 gap-1" onClick={() => alert("Yeni adres ekleme modülü eklenebilir.")}>
            <Plus className="h-3.5 w-3.5" /> Ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {addresses.length === 0 ? (
            <div className="text-sm text-muted text-center py-4">Kayıtlı adres bulunamadı.</div>
          ) : (
            addresses.map(addr => (
              <div key={addr.id} className="group flex flex-col rounded-[var(--radius-md)] p-4 ring-1 ring-border bg-surface hover:ring-brand-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-brand-500" />
                    <span className="font-semibold">{addr.label}</span>
                    <Badge className="text-[10px]">{addr.country}</Badge>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 w-7 px-0 text-muted hover:text-foreground">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 px-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteAddress(addr.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 space-y-1 text-xs text-muted pl-6">
                  <div className="flex items-center gap-1.5"><User className="h-3 w-3" /> {addr.name} {addr.company ? `(${addr.company})` : ""}</div>
                  <div className="flex items-center gap-1.5"><Building className="h-3 w-3" /> {addr.address}, {addr.postalCode} {addr.city}</div>
                  <div className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {addr.phone}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card> */}

      {/* BANK ACCOUNTS */}
      {/* <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Banka Hesaplarım</CardTitle>
          <Button variant="secondary" size="sm" className="h-8 gap-1" onClick={() => alert("Yeni banka hesabı ekleme modülü eklenebilir.")}>
            <Plus className="h-3.5 w-3.5" /> Ekle
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {bankAccounts.length === 0 ? (
            <div className="text-sm text-muted text-center py-4">Kayıtlı banka hesabı bulunamadı.</div>
          ) : (
            bankAccounts.map(bank => (
              <div key={bank.id} className="group flex flex-col rounded-[var(--radius-md)] p-4 ring-1 ring-border bg-surface hover:ring-brand-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-500" />
                    <span className="font-semibold">{bank.label}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 w-7 px-0 text-muted hover:text-foreground">
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 px-0 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => deleteBank(bank.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted pl-6 space-y-1">
                  <div><span className="font-medium text-foreground">Banka:</span> {bank.bankName}</div>
                  <div className="font-mono tracking-widest text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit mt-1">{bank.iban}</div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card> */}
    </div>
  );
}

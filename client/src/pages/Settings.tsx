import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { Business } from "@shared/schema";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type DayHours = { open: string; close: string; closed: boolean };
type HoursMap = Record<string, DayHours>;

const DEFAULT_HOURS: HoursMap = Object.fromEntries(
  DAYS.map((day, i) => [day, { open: "08:00", close: "17:00", closed: i >= 5 }])
);

export default function Settings() {
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: business, isLoading } = useQuery<Business>({
    queryKey: ["/api/business"],
  });

  const isOwner = business?.ownerId === user?.id;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [overview, setOverview] = useState("");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [logoUrl, setLogoUrl] = useState("");
  const [hours, setHours] = useState<HoursMap>(DEFAULT_HOURS);

  useEffect(() => {
    if (business) {
      setName(business.name || "");
      setPhone(business.phone || "");
      setAddress(business.address || "");
      setCity(business.city || "");
      setState(business.state || "");
      setZipCode(business.zipCode || "");
      setOverview(business.overview || "");
      setBrandColor(business.brandColor || "#2563eb");
      setLogoUrl(business.logoUrl || "");
      setHours(business.hoursOfOperation || DEFAULT_HOURS);
    }
  }, [business]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PATCH", "/api/business/settings", {
        name,
        phone,
        address,
        city,
        state,
        zipCode,
        overview,
        brandColor,
        logoUrl,
        hoursOfOperation: hours,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business"] });
      toast({ title: "Settings saved", description: "Your company information has been updated." });
    },
    onError: () => {
      toast({ title: "Save failed", description: "Could not save settings. Only the business owner can make changes.", variant: "destructive" });
    },
  });

  const updateDay = (day: string, field: keyof DayHours, value: string | boolean) => {
    setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" data-testid="back-to-dashboard">
                  <i className="fas fa-arrow-left mr-2"></i>
                  <span className="hidden sm:inline">Dashboard</span>
                </Button>
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-cog text-primary text-sm"></i>
                </div>
                <div>
                  <h1 className="text-base font-semibold text-foreground">Company Information Settings</h1>
                </div>
              </div>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !isOwner}
              data-testid="button-save-settings"
            >
              {saveMutation.isPending ? (
                <><i className="fas fa-spinner fa-spin mr-2"></i>Saving…</>
              ) : (
                <><i className="fas fa-save mr-2"></i>Save Changes</>
              )}
            </Button>
          </div>
        </div>
      </header>

      {!isOwner && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="flex items-center gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300">
            <i className="fas fa-lock text-sm"></i>
            <p className="text-sm">Only the business owner can edit these settings. You can view them but not save changes.</p>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <i className="fas fa-building text-primary text-sm"></i>
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Company Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your company name"
                  disabled={!isOwner}
                  data-testid="input-company-name"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Phone Number</label>
                <Input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="(555) 000-0000"
                  type="tel"
                  disabled={!isOwner}
                  data-testid="input-company-phone"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Street Address</label>
              <Input
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="123 Main Street, Suite 100"
                disabled={!isOwner}
                data-testid="input-company-address"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-2 sm:col-span-1 space-y-1.5">
                <label className="text-sm font-medium text-foreground">City</label>
                <Input
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="City"
                  disabled={!isOwner}
                  data-testid="input-company-city"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">State</label>
                <Select value={state} onValueChange={setState} disabled={!isOwner}>
                  <SelectTrigger data-testid="select-company-state">
                    <SelectValue placeholder="State" />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(s => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">ZIP Code</label>
                <Input
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value)}
                  placeholder="00000"
                  disabled={!isOwner}
                  data-testid="input-company-zip"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">Company Overview</label>
              <Textarea
                value={overview}
                onChange={e => setOverview(e.target.value)}
                placeholder="Brief description of your company, services, and specialties…"
                rows={4}
                disabled={!isOwner}
                data-testid="textarea-company-overview"
              />
            </div>
          </CardContent>
        </Card>

        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <i className="fas fa-palette text-primary text-sm"></i>
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Brand color */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Brand Color</label>
              <p className="text-xs text-muted-foreground">Used as the accent color on reports and estimates</p>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    disabled={!isOwner}
                    className="w-12 h-12 rounded-lg cursor-pointer border border-border p-0.5 bg-transparent disabled:cursor-not-allowed"
                    data-testid="input-brand-color"
                  />
                </div>
                <Input
                  value={brandColor}
                  onChange={e => {
                    const v = e.target.value;
                    if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBrandColor(v);
                  }}
                  className="w-32 font-mono text-sm"
                  placeholder="#2563eb"
                  disabled={!isOwner}
                  data-testid="input-brand-color-hex"
                />
                <div
                  className="w-12 h-12 rounded-lg border border-border shadow-sm flex-shrink-0"
                  style={{ backgroundColor: brandColor }}
                  title="Color preview"
                />
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Company Logo</label>
              <p className="text-xs text-muted-foreground">Appears on reports and estimates</p>
              <div className="flex items-start gap-4 flex-wrap">
                {logoUrl ? (
                  <div className="relative group">
                    <img
                      src={logoUrl}
                      alt="Company logo"
                      className="h-20 max-w-48 object-contain rounded-lg border border-border bg-muted p-2"
                      data-testid="img-company-logo"
                    />
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl("")}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid="button-remove-logo"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="h-20 w-40 rounded-lg border-2 border-dashed border-border bg-muted flex items-center justify-center text-muted-foreground text-xs">
                    No logo yet
                  </div>
                )}
                {isOwner && (
                  <div className="flex flex-col gap-2">
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5 * 1024 * 1024}
                      onGetUploadParameters={async () => {
                        const res = await fetch("/api/objects/upload", {
                          method: "POST",
                          credentials: "include",
                        });
                        const { uploadURL } = await res.json();
                        return { method: "PUT" as const, url: uploadURL };
                      }}
                      onComplete={(result) => {
                        const uploaded = result.successful?.[0];
                        if (uploaded) {
                          const url = (uploaded.uploadURL as string)?.split("?")[0] || "";
                          setLogoUrl(url);
                        }
                      }}
                    >
                      <i className="fas fa-upload mr-2"></i>
                      {logoUrl ? "Replace Logo" : "Upload Logo"}
                    </ObjectUploader>
                    <p className="text-xs text-muted-foreground">PNG, JPG, or SVG — max 5 MB</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hours of Operation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <i className="fas fa-clock text-primary text-sm"></i>
              Hours of Operation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0 divide-y divide-border">
              {DAYS.map(day => {
                const dayHours = hours[day] || { open: "08:00", close: "17:00", closed: false };
                return (
                  <div key={day} className="flex items-center gap-3 py-3 flex-wrap sm:flex-nowrap">
                    <span className="text-sm font-medium text-foreground w-24 flex-shrink-0">{day.slice(0, 3)}</span>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!dayHours.closed}
                        onCheckedChange={v => updateDay(day, "closed", !v)}
                        disabled={!isOwner}
                        data-testid={`switch-${day.toLowerCase()}`}
                      />
                      <span className={`text-xs w-10 ${dayHours.closed ? "text-muted-foreground" : "text-green-600 dark:text-green-400"}`}>
                        {dayHours.closed ? "Closed" : "Open"}
                      </span>
                    </div>
                    {!dayHours.closed && (
                      <div className="flex items-center gap-2 ml-0 sm:ml-2">
                        <input
                          type="time"
                          value={dayHours.open}
                          onChange={e => updateDay(day, "open", e.target.value)}
                          disabled={!isOwner}
                          className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground disabled:opacity-50"
                          data-testid={`time-open-${day.toLowerCase()}`}
                        />
                        <span className="text-muted-foreground text-sm">to</span>
                        <input
                          type="time"
                          value={dayHours.close}
                          onChange={e => updateDay(day, "close", e.target.value)}
                          disabled={!isOwner}
                          className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground disabled:opacity-50"
                          data-testid={`time-close-${day.toLowerCase()}`}
                        />
                      </div>
                    )}
                    {dayHours.closed && (
                      <span className="text-xs text-muted-foreground ml-0 sm:ml-2 italic">Closed all day</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Save button (bottom) */}
        <div className="flex justify-end pb-8">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !isOwner}
            size="lg"
            data-testid="button-save-settings-bottom"
          >
            {saveMutation.isPending ? (
              <><i className="fas fa-spinner fa-spin mr-2"></i>Saving…</>
            ) : (
              <><i className="fas fa-save mr-2"></i>Save Changes</>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}

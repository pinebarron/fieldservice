// Industry configuration system
// Toggle industries on/off via ENABLED_INDUSTRIES env var or here directly

export type IndustryId = 'solar' | 'pressure-washing';

export interface IndustryConfig {
  id: IndustryId;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  icon: string;
  color: string; // Primary color theme
  workTypes: string[];
  pricingItems: { name: string; unit: string; defaultPrice?: number }[];
  starterTemplates: StarterTemplate[];
}

export interface StarterTemplate {
  id: string;
  name: string;
  description: string;
  workType: string;
  icon: string;
  fields: TemplateField[];
  sections?: { id: string; title: string }[];
}

interface TemplateField {
  id: string;
  type: string;
  label: string;
  sectionId?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  photoConfig?: {
    gpsRequired?: boolean;
    verifyLocation?: boolean;
    verificationRadius?: number;
    classification?: 'before' | 'after' | 'general';
    minPhotos?: number;
    maxPhotos?: number;
  };
}

// ===========================================
// INDUSTRY CONFIGURATIONS
// ===========================================

export const INDUSTRIES: Record<IndustryId, IndustryConfig> = {
  'solar': {
    id: 'solar',
    name: 'Solar',
    tagline: 'Solar installation and field service teams',
    description: 'Professional work log management for solar installers, maintenance crews, and inspection teams.',
    heroImage: '/solar_home.png',
    icon: 'fa-solar-panel',
    color: 'green',
    workTypes: [
      // Installation & Sales
      'Solar Installation',
      'Site Survey',
      'Consultation',
      // Operations & Maintenance
      'Solar Maintenance',
      'Solar Repair',
      'Inspection',
      'Panel Cleaning',
      'Module Washing',
      'Vegetation Management',
      'Soiling Analysis',
      'Inverter Service',
      'Tracker Service',
      'Thermal Imaging',
      'Performance Audit',
      // Electrical
      'Electrical Troubleshooting',
      'Monitoring System',
    ],
    pricingItems: [
      // System Components
      { name: 'Solar Panel', unit: 'panel', defaultPrice: 250 },
      { name: 'Microinverter', unit: 'unit', defaultPrice: 180 },
      { name: 'String Inverter', unit: 'unit', defaultPrice: 1500 },
      { name: 'Power Optimizer', unit: 'unit', defaultPrice: 120 },
      { name: 'Battery Storage', unit: 'kWh', defaultPrice: 800 },
      { name: 'EV Charger', unit: 'unit', defaultPrice: 650 },

      // Installation & Hardware
      { name: 'Racking/Mounting', unit: 'panel', defaultPrice: 45 },
      { name: 'Conduit Run', unit: 'linear ft', defaultPrice: 8 },
      { name: 'Critter Guard', unit: 'linear ft', defaultPrice: 12 },
      { name: 'Main Panel Upgrade', unit: 'flat', defaultPrice: 2500 },
      { name: 'Subpanel Installation', unit: 'flat', defaultPrice: 1200 },

      // Labor
      { name: 'Installation Labor', unit: 'hour', defaultPrice: 75 },
      { name: 'Electrical Work', unit: 'hour', defaultPrice: 95 },
      { name: 'Roofing/Penetrations', unit: 'hour', defaultPrice: 85 },

      // Services
      { name: 'Panel Cleaning', unit: 'panel', defaultPrice: 15 },
      { name: 'System Inspection', unit: 'flat', defaultPrice: 150 },
      { name: 'Monitoring Setup', unit: 'flat', defaultPrice: 200 },
      { name: 'System Design', unit: 'flat', defaultPrice: 500 },
      { name: 'Permit Filing', unit: 'flat', defaultPrice: 150 },
      { name: 'Utility Interconnection', unit: 'flat', defaultPrice: 300 },

      // Per-Watt Pricing (common for full system quotes)
      { name: 'Full System Install', unit: 'watt', defaultPrice: 2.50 },
    ],
    starterTemplates: [
      {
        id: 'solar-site-survey',
        name: 'Site Survey',
        description: 'Initial site assessment for new installations',
        workType: 'Site Survey',
        icon: 'fa-clipboard-check',
        sections: [
          { id: 'site', title: 'Site Information' },
          { id: 'electrical', title: 'Electrical Assessment' },
          { id: 'photos', title: 'Documentation' },
        ],
        fields: [
          { id: 'access_notes', type: 'textarea', label: 'Site Access Notes', sectionId: 'site' },
          { id: 'roof_type', type: 'select', label: 'Roof Type', sectionId: 'site', options: [
            { label: 'Composition Shingle', value: 'comp_shingle' },
            { label: 'Tile', value: 'tile' },
            { label: 'Metal', value: 'metal' },
            { label: 'Flat/TPO', value: 'flat' },
          ]},
          { id: 'roof_age', type: 'number', label: 'Estimated Roof Age (years)', sectionId: 'site' },
          { id: 'shading', type: 'select', label: 'Shading Conditions', sectionId: 'site', options: [
            { label: 'No Shading', value: 'none' },
            { label: 'Minimal (< 10%)', value: 'minimal' },
            { label: 'Moderate (10-30%)', value: 'moderate' },
            { label: 'Significant (> 30%)', value: 'significant' },
          ]},
          { id: 'panel_capacity', type: 'number', label: 'Main Panel Capacity (Amps)', sectionId: 'electrical' },
          { id: 'panel_location', type: 'text', label: 'Panel Location', sectionId: 'electrical' },
          { id: 'photo_roof', type: 'photo', label: 'Roof Photos', sectionId: 'photos', photoConfig: {
            verifyLocation: true, verificationRadius: 100, classification: 'general', minPhotos: 1, maxPhotos: 5
          }},
          { id: 'photo_panel', type: 'photo', label: 'Electrical Panel Photos', sectionId: 'photos', photoConfig: {
            verifyLocation: true, verificationRadius: 100, classification: 'general', minPhotos: 1, maxPhotos: 3
          }},
        ],
      },
      {
        id: 'solar-installation',
        name: 'Installation Checklist',
        description: 'Track installation progress and completion',
        workType: 'Solar Installation',
        icon: 'fa-solar-panel',
        sections: [
          { id: 'safety', title: 'Safety Check' },
          { id: 'install', title: 'Installation Steps' },
          { id: 'completion', title: 'Completion' },
        ],
        fields: [
          { id: 'safety_gear', type: 'checkbox', label: 'PPE worn by all workers', required: true, sectionId: 'safety' },
          { id: 'ladder_secured', type: 'checkbox', label: 'Ladder properly secured', required: true, sectionId: 'safety' },
          { id: 'panels_installed', type: 'checkbox', label: 'Panels installed', sectionId: 'install' },
          { id: 'panel_count', type: 'number', label: 'Number of panels installed', sectionId: 'install' },
          { id: 'inverter_serial', type: 'text', label: 'Inverter Serial Number', sectionId: 'install' },
          { id: 'system_tested', type: 'checkbox', label: 'System tested and operational', sectionId: 'completion' },
          { id: 'photo_before', type: 'photo', label: 'Before Photos', sectionId: 'safety', photoConfig: {
            classification: 'before', minPhotos: 1, maxPhotos: 5
          }},
          { id: 'photo_completed', type: 'photo', label: 'Completed Installation', sectionId: 'completion', photoConfig: {
            classification: 'after', minPhotos: 1, maxPhotos: 5
          }},
          { id: 'customer_signature', type: 'signature', label: 'Customer Signature', sectionId: 'completion' },
        ],
      },
    ],
  },

  'pressure-washing': {
    id: 'pressure-washing',
    name: 'Pressure Washing',
    tagline: 'Pressure washing and exterior cleaning pros',
    description: 'Professional job tracking for pressure washing, soft washing, and exterior cleaning businesses.',
    heroImage: '/pressure-washing-hero.png', // You'll add this image
    icon: 'fa-spray-can',
    color: 'blue',
    workTypes: [
      'House Wash',
      'Driveway Cleaning',
      'Deck & Patio',
      'Roof Soft Wash',
      'Gutter Cleaning',
      'Commercial Wash',
      'Fleet Washing',
      'Graffiti Removal',
      'Estimate Visit',
    ],
    pricingItems: [
      { name: 'House Wash (1 story)', unit: 'sqft', defaultPrice: 0.15 },
      { name: 'House Wash (2 story)', unit: 'sqft', defaultPrice: 0.20 },
      { name: 'Driveway/Concrete', unit: 'sqft', defaultPrice: 0.12 },
      { name: 'Deck Cleaning', unit: 'sqft', defaultPrice: 0.25 },
      { name: 'Roof Soft Wash', unit: 'sqft', defaultPrice: 0.30 },
      { name: 'Gutter Cleaning', unit: 'linear ft', defaultPrice: 1.50 },
      { name: 'Minimum Service Call', unit: 'flat', defaultPrice: 150 },
    ],
    starterTemplates: [
      {
        id: 'pw-job-checklist',
        name: 'Job Completion Checklist',
        description: 'Document before/after and job details',
        workType: 'House Wash',
        icon: 'fa-clipboard-check',
        sections: [
          { id: 'arrival', title: 'Arrival' },
          { id: 'work', title: 'Work Details' },
          { id: 'photos', title: 'Before & After Photos' },
          { id: 'completion', title: 'Completion' },
        ],
        fields: [
          { id: 'arrival_time', type: 'time', label: 'Arrival Time', sectionId: 'arrival' },
          { id: 'customer_home', type: 'checkbox', label: 'Customer was home', sectionId: 'arrival' },
          { id: 'water_source', type: 'select', label: 'Water Source', sectionId: 'arrival', options: [
            { label: 'Customer spigot', value: 'customer' },
            { label: 'Brought own tank', value: 'tank' },
          ]},
          { id: 'surfaces_cleaned', type: 'textarea', label: 'Surfaces Cleaned', sectionId: 'work', required: true },
          { id: 'chemicals_used', type: 'select', label: 'Cleaning Solution', sectionId: 'work', options: [
            { label: 'House Wash Mix (SH)', value: 'house_wash' },
            { label: 'Degreaser', value: 'degreaser' },
            { label: 'Water Only', value: 'water' },
            { label: 'Roof Wash Mix', value: 'roof_wash' },
          ]},
          { id: 'photo_before', type: 'photo', label: 'BEFORE Photos', sectionId: 'photos', required: true, photoConfig: {
            gpsRequired: false, verifyLocation: true, verificationRadius: 100, classification: 'before', minPhotos: 2, maxPhotos: 10
          }},
          { id: 'photo_after', type: 'photo', label: 'AFTER Photos', sectionId: 'photos', required: true, photoConfig: {
            gpsRequired: false, verifyLocation: true, verificationRadius: 100, classification: 'after', minPhotos: 2, maxPhotos: 10
          }},
          { id: 'issues_found', type: 'textarea', label: 'Issues or Damage Found', sectionId: 'completion' },
          { id: 'departure_time', type: 'time', label: 'Departure Time', sectionId: 'completion' },
          { id: 'customer_signature', type: 'signature', label: 'Customer Approval', sectionId: 'completion' },
        ],
      },
      {
        id: 'pw-estimate',
        name: 'Estimate Walkthrough',
        description: 'Capture details for accurate quoting',
        workType: 'Estimate Visit',
        icon: 'fa-calculator',
        sections: [
          { id: 'property', title: 'Property Details' },
          { id: 'surfaces', title: 'Surfaces to Clean' },
          { id: 'photos', title: 'Documentation' },
        ],
        fields: [
          { id: 'property_type', type: 'select', label: 'Property Type', sectionId: 'property', options: [
            { label: 'Single Family Home', value: 'sfh' },
            { label: 'Townhouse', value: 'townhouse' },
            { label: 'Multi-Family', value: 'multi' },
            { label: 'Commercial', value: 'commercial' },
          ]},
          { id: 'stories', type: 'select', label: 'Number of Stories', sectionId: 'property', options: [
            { label: '1 Story', value: '1' },
            { label: '2 Story', value: '2' },
            { label: '3+ Story', value: '3plus' },
          ]},
          { id: 'sqft_estimate', type: 'number', label: 'Estimated Sq Ft', sectionId: 'property' },
          { id: 'house_wash', type: 'checkbox', label: 'House/Siding Wash', sectionId: 'surfaces' },
          { id: 'driveway', type: 'checkbox', label: 'Driveway/Concrete', sectionId: 'surfaces' },
          { id: 'deck_patio', type: 'checkbox', label: 'Deck/Patio', sectionId: 'surfaces' },
          { id: 'roof', type: 'checkbox', label: 'Roof Soft Wash', sectionId: 'surfaces' },
          { id: 'gutters', type: 'checkbox', label: 'Gutter Cleaning', sectionId: 'surfaces' },
          { id: 'fence', type: 'checkbox', label: 'Fence', sectionId: 'surfaces' },
          { id: 'condition_notes', type: 'textarea', label: 'Condition Notes', sectionId: 'surfaces' },
          { id: 'photos', type: 'photo', label: 'Property Photos', sectionId: 'photos', photoConfig: {
            classification: 'general', minPhotos: 3, maxPhotos: 15
          }},
          { id: 'access_notes', type: 'textarea', label: 'Access/Special Notes', sectionId: 'photos' },
        ],
      },
      {
        id: 'pw-roof-wash',
        name: 'Roof Soft Wash',
        description: 'Specialized roof cleaning documentation',
        workType: 'Roof Soft Wash',
        icon: 'fa-home',
        sections: [
          { id: 'inspection', title: 'Pre-Wash Inspection' },
          { id: 'work', title: 'Work Details' },
          { id: 'photos', title: 'Documentation' },
        ],
        fields: [
          { id: 'roof_type', type: 'select', label: 'Roof Type', sectionId: 'inspection', options: [
            { label: 'Asphalt Shingle', value: 'asphalt' },
            { label: 'Tile', value: 'tile' },
            { label: 'Metal', value: 'metal' },
            { label: 'Slate', value: 'slate' },
            { label: 'Cedar Shake', value: 'cedar' },
          ]},
          { id: 'algae_level', type: 'select', label: 'Algae/Moss Level', sectionId: 'inspection', options: [
            { label: 'Light - Discoloration', value: 'light' },
            { label: 'Moderate - Visible streaks', value: 'moderate' },
            { label: 'Heavy - Thick growth', value: 'heavy' },
          ]},
          { id: 'damage_noted', type: 'textarea', label: 'Pre-existing Damage', sectionId: 'inspection' },
          { id: 'mix_ratio', type: 'text', label: 'SH Mix Ratio Used', sectionId: 'work' },
          { id: 'dwell_time', type: 'number', label: 'Dwell Time (minutes)', sectionId: 'work' },
          { id: 'plants_protected', type: 'checkbox', label: 'Plants/landscaping protected', sectionId: 'work', required: true },
          { id: 'photo_before', type: 'photo', label: 'Before Photos', sectionId: 'photos', photoConfig: {
            classification: 'before', minPhotos: 2, maxPhotos: 8
          }},
          { id: 'photo_after', type: 'photo', label: 'After Photos', sectionId: 'photos', photoConfig: {
            classification: 'after', minPhotos: 2, maxPhotos: 8
          }},
        ],
      },
    ],
  },
};

// ===========================================
// ENABLED INDUSTRIES (Toggle here!)
// ===========================================

// Set which industries are enabled
// In production, you might read this from env: process.env.ENABLED_INDUSTRIES?.split(',')
export const ENABLED_INDUSTRIES: IndustryId[] = [
  'solar',
  // 'pressure-washing',  // Uncomment to enable
];

// ===========================================
// HELPER FUNCTIONS
// ===========================================

export function getEnabledIndustries(): IndustryConfig[] {
  return ENABLED_INDUSTRIES.map(id => INDUSTRIES[id]).filter(Boolean);
}

export function getIndustry(id: IndustryId): IndustryConfig | undefined {
  return INDUSTRIES[id];
}

export function isIndustryEnabled(id: IndustryId): boolean {
  return ENABLED_INDUSTRIES.includes(id);
}

export function getWorkTypesForIndustry(id: IndustryId): string[] {
  return INDUSTRIES[id]?.workTypes || [];
}

export function getAllEnabledWorkTypes(): string[] {
  return ENABLED_INDUSTRIES.flatMap(id => INDUSTRIES[id]?.workTypes || []);
}

export function getStarterTemplatesForIndustry(id: IndustryId): StarterTemplate[] {
  return INDUSTRIES[id]?.starterTemplates || [];
}

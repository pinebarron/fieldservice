'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/PropertyForm';
import { deleteProperty } from './actions';

interface Property {
  id: string;
  property_name: string;
  customer_name: string;
  location_name: string;
  city: string;
  state: string;
  zip_code: string;
  status: string;
  notes: string | null;
}

interface PropertiesClientProps {
  properties: Property[] | null;
}

export function PropertiesClient({ properties }: PropertiesClientProps) {
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return;
    setDeleting(id);
    await deleteProperty(id);
    router.refresh();
    setDeleting(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Properties</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your job sites and customer locations
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i>
          Add Property
        </Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Property</h3>
              <PropertyForm
                onClose={() => setShowForm(false)}
                onSuccess={() => router.refresh()}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {!properties || properties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-building text-2xl text-muted-foreground"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No properties yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first property to start tracking job sites.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <i className="fas fa-plus mr-2"></i>
              Add Your First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card key={property.id} className="hover:border-primary/50 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-building text-primary"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{property.property_name}</h3>
                    <p className="text-sm text-muted-foreground">{property.customer_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {property.city}, {property.state} {property.zip_code}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      property.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {property.status}
                    </span>
                    <button
                      onClick={() => handleDelete(property.id)}
                      disabled={deleting === property.id}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      {deleting === property.id ? '...' : <i className="fas fa-trash"></i>}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

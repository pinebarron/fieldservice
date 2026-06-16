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
  property_type: string;
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
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this property?')) return;
    setDeleting(id);
    await deleteProperty(id);
    router.refresh();
    setDeleting(null);
  };

  const handleEdit = (property: Property) => {
    setEditingProperty(property);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProperty(null);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Properties</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage your work sites and customer locations
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowForm(true)}>
          <i className="fas fa-plus"></i>
          Add Property
        </Button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Add New Property</h3>
              <PropertyForm
                onClose={handleCloseForm}
                onSuccess={() => router.refresh()}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Form Modal */}
      {editingProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Edit Property</h3>
              <PropertyForm
                onClose={handleCloseForm}
                onSuccess={() => router.refresh()}
                editProperty={editingProperty}
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
              This can be re-used and prefill work order creations.
            </p>
            <Button onClick={() => setShowForm(true)}>
              <i className="fas fa-plus mr-2"></i>
              Add Property/Location
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Card
              key={property.id}
              className="hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => handleEdit(property)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-building text-primary"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground truncate">{property.property_name}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        property.property_type === 'commercial'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {property.property_type === 'commercial' ? 'Comm' : 'Res'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{property.customer_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {property.location_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(property);
                        }}
                        className="text-xs text-muted-foreground hover:text-primary"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button
                        onClick={(e) => handleDelete(property.id, e)}
                        disabled={deleting === property.id}
                        className="text-xs text-muted-foreground hover:text-destructive"
                      >
                        {deleting === property.id ? '...' : <i className="fas fa-trash"></i>}
                      </button>
                    </div>
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

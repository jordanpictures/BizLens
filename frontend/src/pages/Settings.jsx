import { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';

function Settings() {
  const [services, setServices] = useState([]);
  const [packages, setPackages] = useState([]);

  const [newService, setNewService] = useState('');
  const [newPackage, setNewPackage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [svcRes, pkgRes] = await Promise.all([
        fetch('/api/settings/services'),
        fetch('/api/settings/packages')
      ]);
      if (svcRes.ok) setServices(await svcRes.json());
      if (pkgRes.ok) setPackages(await pkgRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (type, value) => {
    if (!value) return;
    
    const url = type === 'service' ? '/api/settings/services' : '/api/settings/packages';
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: value })
      });
      if (res.ok) {
        if (type === 'service') setNewService('');
        if (type === 'package') setNewPackage('');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || `Failed to add ${type}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (type, id) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    try {
      const res = await fetch(`/api/settings/${type}s/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted">Loading settings...</div>;

  return (
    <>
      <PageHeader title="Settings" sub="Manage application configuration" />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Services Manager */}
        <div className="card-panel p-6">
          <h3 className="font-semibold text-lg mb-4">Service Types</h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              className="input-field flex-1" 
              placeholder="E.g., Consultation, Basic Repair..." 
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd('service', newService)}
            />
            <button className="btn" onClick={() => handleAdd('service', newService)}>Add</button>
          </div>
          <div className="divide-y divide-line border-t border-line">
            {services.map(s => (
              <div key={s.id} className="py-3 flex justify-between items-center group">
                <span className="text-sm font-medium">{s.name}</span>
                <button className="text-red-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete('service', s.id)}>Remove</button>
              </div>
            ))}
            {services.length === 0 && <div className="py-3 text-muted text-sm text-center">No services defined.</div>}
          </div>
        </div>

        {/* Packages Manager */}
        <div className="card-panel p-6">
          <h3 className="font-semibold text-lg mb-4">Packages</h3>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              className="input-field flex-1" 
              placeholder="E.g., Premium, Standard..." 
              value={newPackage}
              onChange={(e) => setNewPackage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd('package', newPackage)}
            />
            <button className="btn" onClick={() => handleAdd('package', newPackage)}>Add</button>
          </div>
          <div className="divide-y divide-line border-t border-line">
            {packages.map(p => (
              <div key={p.id} className="py-3 flex justify-between items-center group">
                <span className="text-sm font-medium">{p.name}</span>
                <button className="text-red-600 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDelete('package', p.id)}>Remove</button>
              </div>
            ))}
            {packages.length === 0 && <div className="py-3 text-muted text-sm text-center">No packages defined.</div>}
          </div>
        </div>

      </div>
    </>
  );
}

export default Settings;

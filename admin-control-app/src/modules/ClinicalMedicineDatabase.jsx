/**
 * Clinical Medicine Database Manager
 * Admin module for managing clinical medicine information
 * Focus: Generic names, brands, drug classes, contraindications, safety flags
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, AlertTriangle, Info, RefreshCw } from 'lucide-react';
import { syncMedicineDatabase } from '../services/medicineSyncService';
import './ClinicalMedicineDatabase.css';

const ClinicalMedicineDatabase = ({ config, onUpdate }) => {
    const [medicines, setMedicines] = useState([]);
    const [insulins, setInsulins] = useState([]);
    const [activeTab, setActiveTab] = useState('oral-meds');
    const [selectedClass, setSelectedClass] = useState('all');
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (config?.medicineDatabase) {
            setMedicines(config.medicineDatabase.medicines || []);
            setInsulins(config.medicineDatabase.insulins || []);
        }
    }, [config]);

    const handleSyncFromMainApp = async () => {
        if (!confirm('This will import all medicines and insulins from the main app database. Continue?')) return;

        setIsSyncing(true);
        try {
            const result = await syncMedicineDatabase();
            alert(`✅ Successfully synced ${result.medicines} medicines and ${result.insulins} insulins!`);
            window.location.reload();
        } catch (error) {
            alert('Error syncing database: ' + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // Extract unique drug classes
    const drugClasses = ['all', ...new Set(medicines.map(m => m.class).filter(Boolean))];
    const insulinTypes = ['all', ...new Set(insulins.map(i => i.type).filter(Boolean))];

    const filteredMedicines = medicines.filter(m => {
        const matchesSearch = m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.brands?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.class?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesClass = selectedClass === 'all' || m.class === selectedClass;
        return matchesSearch && matchesClass;
    });

    const filteredInsulins = insulins.filter(i => {
        const matchesSearch = i.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.brand?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = selectedClass === 'all' || i.type === selectedClass;
        return matchesSearch && matchesType;
    });

    const emptyMedicine = {
        id: Date.now(),
        name: '',
        class: '',
        brands: '',
        route: 'oral',
        type: 'mono',
        contraindications: {
            ckd: 'allowed',
            pregnancy: 'safe',
            elderly: 'preferred',
            heartFailure: 'safe'
        },
        safetyFlags: {
            hypoRisk: 'low',
            weightEffect: 'neutral'
        },
        notes: ''
    };

    const emptyInsulin = {
        id: Date.now(),
        name: '',
        type: 'rapid',
        brand: '',
        class: '',
        contraindications: {
            ckd: 'allowed',
            pregnancy: 'safe',
            elderly: 'preferred'
        },
        safetyFlags: {
            hypoRisk: 'moderate',
            weightEffect: 'gain'
        },
        notes: ''
    };

    const handleAdd = (type) => {
        const newItem = type === 'medicine' ? { ...emptyMedicine } : { ...emptyInsulin };
        setEditingItem({ ...newItem, isNew: true, type });
        setShowAddForm(true);
    };

    const handleEdit = (item, type) => {
        setEditingItem({ ...item, type });
        setShowAddForm(true);
    };

    const handleDelete = (id, type) => {
        if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

        if (type === 'medicine') {
            const updated = medicines.filter(m => m.id !== id);
            setMedicines(updated);
            saveToConfig(updated, insulins);
        } else {
            const updated = insulins.filter(i => i.id !== id);
            setInsulins(updated);
            saveToConfig(medicines, updated);
        }
    };

    const handleSave = () => {
        if (!editingItem) return;

        const { type, isNew, ...item } = editingItem;

        if (type === 'medicine') {
            const updated = isNew
                ? [...medicines, item]
                : medicines.map(m => m.id === item.id ? item : m);
            setMedicines(updated);
            saveToConfig(updated, insulins);
        } else {
            const updated = isNew
                ? [...insulins, item]
                : insulins.map(i => i.id === item.id ? item : i);
            setInsulins(updated);
            saveToConfig(medicines, updated);
        }

        setEditingItem(null);
        setShowAddForm(false);
    };

    const handleCancel = () => {
        setEditingItem(null);
        setShowAddForm(false);
    };

    const saveToConfig = (medicineList, insulinList) => {
        onUpdate({
            medicineDatabase: {
                medicines: medicineList,
                insulins: insulinList,
                lastUpdated: new Date().toISOString()
            }
        });
    };

    const updateField = (field, value) => {
        setEditingItem(prev => ({ ...prev, [field]: value }));
    };

    const updateNestedField = (parent, field, value) => {
        setEditingItem(prev => ({
            ...prev,
            [parent]: { ...prev[parent], [field]: value }
        }));
    };

    const getSafetyBadge = (level, type) => {
        const colors = {
            hypo: { low: '#10B981', moderate: '#F59E0B', high: '#EF4444' },
            weight: { loss: '#10B981', neutral: '#6B7280', gain: '#F59E0B' },
            ckd: { allowed: '#10B981', caution: '#F59E0B', avoid: '#EF4444', dose_reduce: '#F59E0B' },
            pregnancy: { safe: '#10B981', specialist_only: '#F59E0B', avoid: '#EF4444' },
            elderly: { preferred: '#10B981', caution: '#F59E0B', avoid: '#EF4444' }
        };

        return (
            <span style={{
                background: colors[type]?.[level] || '#6B7280',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase'
            }}>
                {level}
            </span>
        );
    };

    const renderMedicineForm = () => (
        <div className="clinical-form-grid">
            <div className="form-section">
                <h4>📋 Basic Information</h4>
                <div className="form-group">
                    <label>Generic Name *</label>
                    <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="e.g., Metformin 500mg"
                    />
                </div>

                <div className="form-group">
                    <label>Drug Class</label>
                    <input
                        type="text"
                        value={editingItem.class}
                        onChange={(e) => updateField('class', e.target.value)}
                        placeholder="e.g., Biguanide, Sulfonylurea, DPP4 Inhibitor"
                    />
                </div>

                <div className="form-group">
                    <label>Brand Names</label>
                    <input
                        type="text"
                        value={editingItem.brands}
                        onChange={(e) => updateField('brands', e.target.value)}
                        placeholder="e.g., Glycomet, Cetapin, Obimet"
                    />
                    <small>Separate multiple brands with commas</small>
                </div>

                <div className="form-group">
                    <label>Type</label>
                    <select value={editingItem.type} onChange={(e) => updateField('type', e.target.value)}>
                        <option value="mono">Monotherapy</option>
                        <option value="dual">Dual Combination</option>
                        <option value="triple">Triple Combination</option>
                    </select>
                </div>
            </div>

            <div className="form-section">
                <h4>⚠️ Safety Flags</h4>
                <div className="form-group">
                    <label>Hypoglycemia Risk</label>
                    <select
                        value={editingItem.safetyFlags?.hypoRisk || 'low'}
                        onChange={(e) => updateNestedField('safetyFlags', 'hypoRisk', e.target.value)}
                    >
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Weight Effect</label>
                    <select
                        value={editingItem.safetyFlags?.weightEffect || 'neutral'}
                        onChange={(e) => updateNestedField('safetyFlags', 'weightEffect', e.target.value)}
                    >
                        <option value="loss">Weight Loss</option>
                        <option value="neutral">Neutral</option>
                        <option value="gain">Weight Gain</option>
                    </select>
                </div>
            </div>

            <div className="form-section">
                <h4>🚫 Contraindications</h4>
                <div className="form-group">
                    <label>CKD / Renal Impairment</label>
                    <select
                        value={editingItem.contraindications?.ckd || 'allowed'}
                        onChange={(e) => updateNestedField('contraindications', 'ckd', e.target.value)}
                    >
                        <option value="allowed">Allowed</option>
                        <option value="caution">Use with Caution</option>
                        <option value="dose_reduce">Dose Reduction Required</option>
                        <option value="avoid">Avoid / Contraindicated</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Pregnancy</label>
                    <select
                        value={editingItem.contraindications?.pregnancy || 'safe'}
                        onChange={(e) => updateNestedField('contraindications', 'pregnancy', e.target.value)}
                    >
                        <option value="safe">Safe</option>
                        <option value="specialist_only">Specialist Only</option>
                        <option value="avoid">Avoid / Contraindicated</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Elderly Patients</label>
                    <select
                        value={editingItem.contraindications?.elderly || 'preferred'}
                        onChange={(e) => updateNestedField('contraindications', 'elderly', e.target.value)}
                    >
                        <option value="preferred">Preferred</option>
                        <option value="caution">Use with Caution</option>
                        <option value="avoid">Avoid</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Heart Failure</label>
                    <select
                        value={editingItem.contraindications?.heartFailure || 'safe'}
                        onChange={(e) => updateNestedField('contraindications', 'heartFailure', e.target.value)}
                    >
                        <option value="safe">Safe</option>
                        <option value="benefit">Cardiovascular Benefit</option>
                        <option value="neutral">Neutral</option>
                        <option value="avoid">Avoid</option>
                    </select>
                </div>
            </div>

            <div className="form-section full-width">
                <h4>📝 Clinical Notes</h4>
                <div className="form-group">
                    <textarea
                        value={editingItem.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        placeholder="Additional clinical information, warnings, drug interactions..."
                        rows="4"
                    />
                </div>
            </div>
        </div>
    );

    const renderInsulinForm = () => (
        <div className="clinical-form-grid">
            <div className="form-section">
                <h4>📋 Basic Information</h4>
                <div className="form-group">
                    <label>Insulin Name *</label>
                    <input
                        type="text"
                        value={editingItem.name}
                        onChange={(e) => updateField('name', e.target.value)}
                        placeholder="e.g., Insulin Glargine, NovoRapid"
                    />
                </div>

                <div className="form-group">
                    <label>Type</label>
                    <select value={editingItem.type} onChange={(e) => updateField('type', e.target.value)}>
                        <option value="rapid">Rapid Acting</option>
                        <option value="short">Short Acting</option>
                        <option value="intermediate">Intermediate Acting</option>
                        <option value="basal">Basal / Long Acting</option>
                        <option value="ultra-long">Ultra-Long Acting</option>
                        <option value="premix">Premixed</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Brand Names</label>
                    <input
                        type="text"
                        value={editingItem.brand}
                        onChange={(e) => updateField('brand', e.target.value)}
                        placeholder="e.g., Lantus, Basalog, NovoRapid"
                    />
                </div>

                <div className="form-group">
                    <label>Class</label>
                    <input
                        type="text"
                        value={editingItem.class}
                        onChange={(e) => updateField('class', e.target.value)}
                        placeholder="e.g., Analog Basal, Human Short-Acting"
                    />
                </div>
            </div>

            <div className="form-section">
                <h4>⚠️ Safety Flags</h4>
                <div className="form-group">
                    <label>Hypoglycemia Risk</label>
                    <select
                        value={editingItem.safetyFlags?.hypoRisk || 'moderate'}
                        onChange={(e) => updateNestedField('safetyFlags', 'hypoRisk', e.target.value)}
                    >
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Weight Effect</label>
                    <select
                        value={editingItem.safetyFlags?.weightEffect || 'gain'}
                        onChange={(e) => updateNestedField('safetyFlags', 'weightEffect', e.target.value)}
                    >
                        <option value="loss">Weight Loss</option>
                        <option value="neutral">Neutral</option>
                        <option value="gain">Weight Gain</option>
                    </select>
                </div>
            </div>

            <div className="form-section">
                <h4>🚫 Contraindications</h4>
                <div className="form-group">
                    <label>CKD / Renal Impairment</label>
                    <select
                        value={editingItem.contraindications?.ckd || 'allowed'}
                        onChange={(e) => updateNestedField('contraindications', 'ckd', e.target.value)}
                    >
                        <option value="allowed">Allowed</option>
                        <option value="dose_reduce">Dose Reduction Required</option>
                        <option value="avoid">Avoid</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Pregnancy</label>
                    <select
                        value={editingItem.contraindications?.pregnancy || 'safe'}
                        onChange={(e) => updateNestedField('contraindications', 'pregnancy', e.target.value)}
                    >
                        <option value="safe">Safe</option>
                        <option value="specialist_only">Specialist Only</option>
                        <option value="avoid">Avoid</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Elderly Patients</label>
                    <select
                        value={editingItem.contraindications?.elderly || 'preferred'}
                        onChange={(e) => updateNestedField('contraindications', 'elderly', e.target.value)}
                    >
                        <option value="preferred">Preferred</option>
                        <option value="caution">Use with Caution</option>
                        <option value="avoid">Avoid</option>
                    </select>
                </div>
            </div>

            <div className="form-section full-width">
                <h4>📝 Clinical Notes</h4>
                <div className="form-group">
                    <textarea
                        value={editingItem.notes}
                        onChange={(e) => updateField('notes', e.target.value)}
                        placeholder="Onset/peak/duration, storage requirements, special considerations..."
                        rows="4"
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="clinical-medicine-database">
            <div className="manager-header">
                <div>
                    <h2>💊 Clinical Medicine Database</h2>
                    <p>Manage clinical information: drug classes, contraindications, safety flags</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleSyncFromMainApp}
                        className="add-btn-secondary"
                        disabled={isSyncing}
                        style={{ background: isSyncing ? '#9CA3AF' : 'white' }}
                    >
                        <RefreshCw size={16} className={isSyncing ? 'spinning' : ''} />
                        {isSyncing ? 'Syncing...' : 'Sync from Main App'}
                    </button>
                    <button onClick={() => handleAdd(activeTab === 'oral-meds' ? 'medicine' : 'insulin')} className="add-btn">
                        <Plus size={16} />
                        Add {activeTab === 'oral-meds' ? 'Medicine' : 'Insulin'}
                    </button>
                </div>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'oral-meds' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('oral-meds'); setSelectedClass('all'); }}
                >
                    💊 Oral Medications ({medicines.length})
                </button>
                <button
                    className={`tab ${activeTab === 'insulins' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('insulins'); setSelectedClass('all'); }}
                >
                    💉 Insulins ({insulins.length})
                </button>
            </div>

            <div className="filters-bar">
                <div className="search-bar">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder={`Search ${activeTab === 'oral-meds' ? 'medicines' : 'insulins'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="class-filter">
                    <label>Filter by {activeTab === 'oral-meds' ? 'Class' : 'Type'}:</label>
                    <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                        {(activeTab === 'oral-meds' ? drugClasses : insulinTypes).map(cls => (
                            <option key={cls} value={cls}>
                                {cls === 'all' ? 'All' : cls}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {showAddForm && editingItem && (
                <div className="modal-overlay" onClick={handleCancel}>
                    <div className="modal-content clinical-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingItem.isNew ? 'Add New' : 'Edit'} {editingItem.type === 'medicine' ? 'Medicine' : 'Insulin'}</h3>
                            <button onClick={handleCancel} className="close-btn">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            {editingItem.type === 'medicine' ? renderMedicineForm() : renderInsulinForm()}
                        </div>
                        <div className="modal-footer">
                            <button onClick={handleCancel} className="cancel-btn">Cancel</button>
                            <button onClick={handleSave} className="save-btn" disabled={!editingItem.name}>
                                <Save size={16} />
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="items-list">
                {activeTab === 'oral-meds' ? (
                    filteredMedicines.length === 0 ? (
                        <div className="empty-state">
                            <Info size={48} />
                            <p>No medicines found</p>
                            <button onClick={() => handleAdd('medicine')} className="add-btn-secondary">
                                <Plus size={16} />
                                Add Your First Medicine
                            </button>
                        </div>
                    ) : (
                        <div className="clinical-grid">
                            {filteredMedicines.map(medicine => (
                                <div key={medicine.id} className="clinical-card">
                                    <div className="card-header">
                                        <div>
                                            <h4>{medicine.name}</h4>
                                            <span className="drug-class">{medicine.class || 'Unclassified'}</span>
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={() => handleEdit(medicine, 'medicine')} className="edit-btn">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(medicine.id, 'medicine')} className="delete-btn">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="clinical-details">
                                        {medicine.brands && (
                                            <div className="detail-row">
                                                <span className="label">Brands:</span>
                                                <span className="value">{medicine.brands}</span>
                                            </div>
                                        )}

                                        <div className="safety-section">
                                            <strong>Safety Flags:</strong>
                                            <div className="badges">
                                                <div>
                                                    <small>Hypo Risk:</small>
                                                    {getSafetyBadge(medicine.safetyFlags?.hypoRisk || 'low', 'hypo')}
                                                </div>
                                                <div>
                                                    <small>Weight:</small>
                                                    {getSafetyBadge(medicine.safetyFlags?.weightEffect || 'neutral', 'weight')}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="contraindications-section">
                                            <strong>Contraindications:</strong>
                                            <div className="badges">
                                                <div>
                                                    <small>CKD:</small>
                                                    {getSafetyBadge(medicine.contraindications?.ckd || 'allowed', 'ckd')}
                                                </div>
                                                <div>
                                                    <small>Pregnancy:</small>
                                                    {getSafetyBadge(medicine.contraindications?.pregnancy || 'safe', 'pregnancy')}
                                                </div>
                                                <div>
                                                    <small>Elderly:</small>
                                                    {getSafetyBadge(medicine.contraindications?.elderly || 'preferred', 'elderly')}
                                                </div>
                                            </div>
                                        </div>

                                        {medicine.notes && (
                                            <div className="notes-section">
                                                <AlertTriangle size={14} />
                                                <small>{medicine.notes}</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    filteredInsulins.length === 0 ? (
                        <div className="empty-state">
                            <span style={{ fontSize: '48px' }}>💉</span>
                            <p>No insulins found</p>
                            <button onClick={() => handleAdd('insulin')} className="add-btn-secondary">
                                <Plus size={16} />
                                Add Your First Insulin
                            </button>
                        </div>
                    ) : (
                        <div className="clinical-grid">
                            {filteredInsulins.map(insulin => (
                                <div key={insulin.id} className="clinical-card">
                                    <div className="card-header">
                                        <div>
                                            <h4>{insulin.name}</h4>
                                            <span className="drug-class">{insulin.type}</span>
                                        </div>
                                        <div className="item-actions">
                                            <button onClick={() => handleEdit(insulin, 'insulin')} className="edit-btn">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => handleDelete(insulin.id, 'insulin')} className="delete-btn">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="clinical-details">
                                        {insulin.brand && (
                                            <div className="detail-row">
                                                <span className="label">Brand:</span>
                                                <span className="value">{insulin.brand}</span>
                                            </div>
                                        )}

                                        {insulin.class && (
                                            <div className="detail-row">
                                                <span className="label">Class:</span>
                                                <span className="value">{insulin.class}</span>
                                            </div>
                                        )}

                                        <div className="safety-section">
                                            <strong>Safety Flags:</strong>
                                            <div className="badges">
                                                <div>
                                                    <small>Hypo Risk:</small>
                                                    {getSafetyBadge(insulin.safetyFlags?.hypoRisk || 'moderate', 'hypo')}
                                                </div>
                                                <div>
                                                    <small>Weight:</small>
                                                    {getSafetyBadge(insulin.safetyFlags?.weightEffect || 'gain', 'weight')}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="contraindications-section">
                                            <strong>Contraindications:</strong>
                                            <div className="badges">
                                                <div>
                                                    <small>CKD:</small>
                                                    {getSafetyBadge(insulin.contraindications?.ckd || 'allowed', 'ckd')}
                                                </div>
                                                <div>
                                                    <small>Pregnancy:</small>
                                                    {getSafetyBadge(insulin.contraindications?.pregnancy || 'safe', 'pregnancy')}
                                                </div>
                                                <div>
                                                    <small>Elderly:</small>
                                                    {getSafetyBadge(insulin.contraindications?.elderly || 'preferred', 'elderly')}
                                                </div>
                                            </div>
                                        </div>

                                        {insulin.notes && (
                                            <div className="notes-section">
                                                <AlertTriangle size={14} />
                                                <small>{insulin.notes}</small>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default ClinicalMedicineDatabase;

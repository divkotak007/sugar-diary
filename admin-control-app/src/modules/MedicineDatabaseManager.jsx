/**
 * Medicine & Insulin Database Manager
 * Admin module for managing medicine and insulin inventory
 */

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Search, Package } from 'lucide-react';
import './MedicineDatabaseManager.css';

const MedicineDatabaseManager = ({ config, onUpdate }) => {
    const [medicines, setMedicines] = useState([]);
    const [insulins, setInsulins] = useState([]);
    const [activeTab, setActiveTab] = useState('medicines');
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    useEffect(() => {
        // Load existing medicines and insulins from config
        setMedicines(config?.medicineDatabase?.medicines || []);
        setInsulins(config?.medicineDatabase?.insulins || []);
    }, [config]);

    const emptyMedicine = {
        id: Date.now(),
        name: '',
        type: 'tablet',
        dosage: '',
        frequency: 'Once Daily',
        stock: 0,
        price: 0,
        manufacturer: '',
        expiryDate: '',
        notes: ''
    };

    const emptyInsulin = {
        id: Date.now(),
        name: '',
        type: 'rapid',
        brand: '',
        concentration: 'U-100',
        stock: 0,
        price: 0,
        expiryDate: '',
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

    const filteredMedicines = medicines.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredInsulins = insulins.filter(i =>
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.brand?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const renderMedicineForm = () => (
        <div className="form-grid">
            <div className="form-group">
                <label>Medicine Name *</label>
                <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Metformin"
                />
            </div>

            <div className="form-group">
                <label>Type</label>
                <select value={editingItem.type} onChange={(e) => updateField('type', e.target.value)}>
                    <option value="tablet">Tablet</option>
                    <option value="capsule">Capsule</option>
                    <option value="liquid">Liquid</option>
                    <option value="injection">Injection</option>
                    <option value="cream">Cream</option>
                </select>
            </div>

            <div className="form-group">
                <label>Dosage</label>
                <input
                    type="text"
                    value={editingItem.dosage}
                    onChange={(e) => updateField('dosage', e.target.value)}
                    placeholder="e.g., 500mg"
                />
            </div>

            <div className="form-group">
                <label>Frequency</label>
                <select value={editingItem.frequency} onChange={(e) => updateField('frequency', e.target.value)}>
                    <option value="Once Daily">Once Daily</option>
                    <option value="Twice Daily">Twice Daily</option>
                    <option value="Thrice Daily">Thrice Daily</option>
                    <option value="Before Meals">Before Meals</option>
                    <option value="After Meals">After Meals</option>
                    <option value="Bedtime">Bedtime</option>
                    <option value="SOS">SOS (As Needed)</option>
                </select>
            </div>

            <div className="form-group">
                <label>Stock (Units)</label>
                <input
                    type="number"
                    value={editingItem.stock}
                    onChange={(e) => updateField('stock', parseInt(e.target.value) || 0)}
                    min="0"
                />
            </div>

            <div className="form-group">
                <label>Price (₹)</label>
                <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                />
            </div>

            <div className="form-group">
                <label>Manufacturer</label>
                <input
                    type="text"
                    value={editingItem.manufacturer}
                    onChange={(e) => updateField('manufacturer', e.target.value)}
                    placeholder="e.g., Sun Pharma"
                />
            </div>

            <div className="form-group">
                <label>Expiry Date</label>
                <input
                    type="date"
                    value={editingItem.expiryDate}
                    onChange={(e) => updateField('expiryDate', e.target.value)}
                />
            </div>

            <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                    value={editingItem.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Additional notes..."
                    rows="3"
                />
            </div>
        </div>
    );

    const renderInsulinForm = () => (
        <div className="form-grid">
            <div className="form-group">
                <label>Insulin Name *</label>
                <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., NovoRapid"
                />
            </div>

            <div className="form-group">
                <label>Type</label>
                <select value={editingItem.type} onChange={(e) => updateField('type', e.target.value)}>
                    <option value="rapid">Rapid Acting</option>
                    <option value="short">Short Acting</option>
                    <option value="intermediate">Intermediate Acting</option>
                    <option value="long">Long Acting</option>
                    <option value="ultra-long">Ultra-Long Acting</option>
                    <option value="premixed">Premixed</option>
                </select>
            </div>

            <div className="form-group">
                <label>Brand</label>
                <input
                    type="text"
                    value={editingItem.brand}
                    onChange={(e) => updateField('brand', e.target.value)}
                    placeholder="e.g., Novo Nordisk"
                />
            </div>

            <div className="form-group">
                <label>Concentration</label>
                <select value={editingItem.concentration} onChange={(e) => updateField('concentration', e.target.value)}>
                    <option value="U-40">U-40</option>
                    <option value="U-100">U-100</option>
                    <option value="U-200">U-200</option>
                    <option value="U-300">U-300</option>
                    <option value="U-500">U-500</option>
                </select>
            </div>

            <div className="form-group">
                <label>Stock (Vials/Pens)</label>
                <input
                    type="number"
                    value={editingItem.stock}
                    onChange={(e) => updateField('stock', parseInt(e.target.value) || 0)}
                    min="0"
                />
            </div>

            <div className="form-group">
                <label>Price (₹)</label>
                <input
                    type="number"
                    value={editingItem.price}
                    onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                />
            </div>

            <div className="form-group">
                <label>Expiry Date</label>
                <input
                    type="date"
                    value={editingItem.expiryDate}
                    onChange={(e) => updateField('expiryDate', e.target.value)}
                />
            </div>

            <div className="form-group full-width">
                <label>Notes</label>
                <textarea
                    value={editingItem.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Storage instructions, usage notes..."
                    rows="3"
                />
            </div>
        </div>
    );

    return (
        <div className="medicine-database-manager">
            <div className="manager-header">
                <div>
                    <h2>💊 Medicine & Insulin Database</h2>
                    <p>Manage your medicine inventory and insulin stock</p>
                </div>
                <button onClick={() => handleAdd(activeTab === 'medicines' ? 'medicine' : 'insulin')} className="add-btn">
                    <Plus size={16} />
                    Add {activeTab === 'medicines' ? 'Medicine' : 'Insulin'}
                </button>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'medicines' ? 'active' : ''}`}
                    onClick={() => setActiveTab('medicines')}
                >
                    <Package size={16} />
                    Medicines ({medicines.length})
                </button>
                <button
                    className={`tab ${activeTab === 'insulins' ? 'active' : ''}`}
                    onClick={() => setActiveTab('insulins')}
                >
                    💉 Insulins ({insulins.length})
                </button>
            </div>

            <div className="search-bar">
                <Search size={18} />
                <input
                    type="text"
                    placeholder={`Search ${activeTab}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {showAddForm && editingItem && (
                <div className="modal-overlay" onClick={handleCancel}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
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
                {activeTab === 'medicines' ? (
                    filteredMedicines.length === 0 ? (
                        <div className="empty-state">
                            <Package size={48} />
                            <p>No medicines found</p>
                            <button onClick={() => handleAdd('medicine')} className="add-btn-secondary">
                                <Plus size={16} />
                                Add Your First Medicine
                            </button>
                        </div>
                    ) : (
                        <div className="items-grid">
                            {filteredMedicines.map(medicine => (
                                <div key={medicine.id} className="item-card">
                                    <div className="item-header">
                                        <div>
                                            <h4>{medicine.name}</h4>
                                            <span className="item-type">{medicine.type}</span>
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
                                    <div className="item-details">
                                        <div className="detail-row">
                                            <span>Dosage:</span>
                                            <strong>{medicine.dosage || 'N/A'}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Frequency:</span>
                                            <strong>{medicine.frequency}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Stock:</span>
                                            <strong className={medicine.stock < 10 ? 'low-stock' : ''}>{medicine.stock} units</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Price:</span>
                                            <strong>₹{medicine.price}</strong>
                                        </div>
                                        {medicine.manufacturer && (
                                            <div className="detail-row">
                                                <span>Manufacturer:</span>
                                                <strong>{medicine.manufacturer}</strong>
                                            </div>
                                        )}
                                        {medicine.expiryDate && (
                                            <div className="detail-row">
                                                <span>Expiry:</span>
                                                <strong>{new Date(medicine.expiryDate).toLocaleDateString()}</strong>
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
                        <div className="items-grid">
                            {filteredInsulins.map(insulin => (
                                <div key={insulin.id} className="item-card">
                                    <div className="item-header">
                                        <div>
                                            <h4>{insulin.name}</h4>
                                            <span className="item-type">{insulin.type}</span>
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
                                    <div className="item-details">
                                        <div className="detail-row">
                                            <span>Brand:</span>
                                            <strong>{insulin.brand || 'N/A'}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Concentration:</span>
                                            <strong>{insulin.concentration}</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Stock:</span>
                                            <strong className={insulin.stock < 3 ? 'low-stock' : ''}>{insulin.stock} vials/pens</strong>
                                        </div>
                                        <div className="detail-row">
                                            <span>Price:</span>
                                            <strong>₹{insulin.price}</strong>
                                        </div>
                                        {insulin.expiryDate && (
                                            <div className="detail-row">
                                                <span>Expiry:</span>
                                                <strong>{new Date(insulin.expiryDate).toLocaleDateString()}</strong>
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

export default MedicineDatabaseManager;

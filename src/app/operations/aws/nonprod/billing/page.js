'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    defaultDropAnimationSideEffects,
    useDroppable,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    rectSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem';

// Helper Component for Containers (Fixed)
function DroppableContainer({ id, items, title, className, total, isShared = false, onEdit, exchangeRate = 1 }) {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    const isOverClass = isOver ? (isShared ? 'bg-orange-100 ring-2 ring-orange-300' : 'bg-blue-50 ring-2 ring-blue-300') : '';

    return (
        <div ref={setNodeRef} className={`${className} ${isOverClass} transition-colors duration-200`}>
            {/* Header */}
            <div className={`flex justify-between items-center mb-4 border-b ${isShared ? 'border-orange-200' : 'border-gray-200'} pb-2`}>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    {/* Only show icon if shared (or customize) */}
                    {isShared ? (
                        <>
                            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            Shared Cost (Distributed to Charge Items)
                        </>
                    ) : (
                        title
                    )}
                </h3>
                <span className={`text-sm font-mono px-2 py-1 rounded ${isShared ? 'bg-orange-200 text-orange-900' : (id === 'charge' ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-800')}`}>
                    Total: {(total * exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
            </div>

            {/* List Area */}
            <div className={`flex-1 overflow-y-auto ${isShared ? '' : 'min-h-[200px]'}`}>
                <SortableContext items={items.map(i => i.id)} strategy={isShared ? rectSortingStrategy : verticalListSortingStrategy}>
                    <div className={isShared ? 'flex flex-wrap gap-4 w-full' : 'space-y-2'}>
                        {items.length === 0 ? (
                            <div className={`w-full text-center text-gray-400 py-10 italic border-2 border-dashed ${isShared ? 'border-orange-200' : 'border-gray-200'} rounded`}>Drop items here</div>
                        ) : (
                            items.map((item) => (
                                <div key={item.id} className={`group relative ${isShared ? 'min-w-[200px] w-full md:w-auto' : ''}`}>
                                    <div className="absolute right-2 top-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                        <button onClick={() => onEdit(item.id, id)} className="bg-white p-1 rounded shadow hover:text-blue-600 text-gray-400" title="Edit">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                        </button>
                                    </div>
                                    <SortableItem key={item.id} id={item.id} name={item.name} cost={item.cost * exchangeRate} type={id} />
                                </div>
                            ))
                        )}
                    </div>
                </SortableContext>
            </div>
        </div>
    );
}

// Trash / Delete Zone
function TrashContainer() {
    const { setNodeRef, isOver } = useDroppable({ id: 'trash' });

    return (
        <div
            ref={setNodeRef}
            className={`
                mt-6 p-4 rounded-lg border-2 border-dashed flex items-center justify-center gap-2 transition-colors
                ${isOver ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-400'}
            `}
            style={{ minHeight: '80px' }}
        >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span className="font-medium">Drop items here to destroy</span>
        </div>
    );
}

const defaultDropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: { opacity: '0.4' },
        },
    }),
};

export default function CostManagementPage() {
    // ---------------- State ----------------
    // 1. Initial Selection State
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [viewMode, setViewMode] = useState('select-period'); // 'select-period' | 'manage-items' | 'final-report'

    // 2. Data State
    const [rawCostData, setRawCostData] = useState(null);
    const [items, setItems] = useState({
        charge: [],
        nonCharge: [],
        shared: [],
    });

    // ---------------- Manual Item Entry State ----------------
    const [newItemName, setNewItemName] = useState('');
    const [newItemCost, setNewItemCost] = useState('');
    const [exchangeRate, setExchangeRate] = useState(34.0);

    // Edit Modal State
    const [editingItem, setEditingItem] = useState(null); // { id, name, cost, container }

    const handleEditItem = (id, container) => {
        const item = items[container].find(i => i.id === id);
        if (item) {
            setEditingItem({ ...item, container });
        }
    };

    const saveEditItem = () => {
        if (!editingItem) return;
        const newCost = parseFloat(editingItem.cost);
        if (isNaN(newCost)) {
            alert("Invalid Cost");
            return;
        }

        setItems(prev => ({
            ...prev,
            [editingItem.container]: prev[editingItem.container].map(item =>
                item.id === editingItem.id ? { ...item, name: editingItem.name, cost: newCost } : item
            )
        }));
        setEditingItem(null);
    };

    const handleAddManualItem = () => {
        if (!newItemName.trim() || !newItemCost) {
            alert('Please enter both Project Name and Cost');
            return;
        }
        const costVal = parseFloat(newItemCost);
        if (isNaN(costVal)) {
            alert('Cost must be a valid number');
            return;
        }

        // Add to 'charge' or 'nonCharge' based on name or default to 'charge' per user request for "additive items"
        // User said "add project:cost", likely specific charges.
        // Let's check name for hint, else default to 'charge'
        let target = 'charge';
        const nameLower = newItemName.toLowerCase();
        if (nameLower.includes('non-charge') || nameLower.includes('noncharge')) target = 'nonCharge';
        else if (nameLower.includes('shared')) target = 'shared';

        const newItem = {
            id: `manual-${Date.now()}`,
            name: newItemName,
            cost: costVal
        };

        setItems(prev => ({
            ...prev,
            [target]: [...prev[target], newItem]
        }));

        setNewItemName('');
        setNewItemCost('');
    };

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [activeId, setActiveId] = useState(null); // For drag overlay

    // Years/Months Data
    const years = [2024, 2025, 2026];
    const months = [
        { id: 1, name: 'Jan' }, { id: 2, name: 'Feb' }, { id: 3, name: 'Mar' },
        { id: 4, name: 'Apr' }, { id: 5, name: 'May' }, { id: 6, name: 'Jun' },
        { id: 7, name: 'Jul' }, { id: 8, name: 'Aug' }, { id: 9, name: 'Sep' },
        { id: 10, name: 'Oct' }, { id: 11, name: 'Nov' }, { id: 12, name: 'Dec' }
    ];

    // ---------------- API Fetch ----------------
    const handleGetCost = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/operations/aws/nonprod/billing?year=${selectedYear}&month=${selectedMonth}`);
            if (!res.ok) throw new Error('Failed to fetch data');
            const data = await res.json();

            setRawCostData(data);

            // Transform data into manageable columns for Drag & Drop
            // Based on initial structure from API: 
            // - 'charge (server)' -> charge
            // - 'Non-charge (Server)' -> nonCharge
            // - 'non-charge-ส่วนกลาง' -> shared (assuming this is the shared bucket based on context)

            const newItems = {
                charge: [],
                nonCharge: [],
                shared: [],
            };

            if (data.groups) {
                // Determine list based on tag format <chargable-pm-project> or default group name
                data.groups.forEach(group => {
                    let defaultTarget = 'nonCharge';
                    const groupNameLower = group.name.toLowerCase();

                    // Fallback to Group Name Logic (Mock Data)
                    if (groupNameLower.includes('charge (server)')) defaultTarget = 'charge';
                    else if (groupNameLower.includes('non-charge (server)')) defaultTarget = 'nonCharge';
                    else if (groupNameLower.includes('ส่วนกลาง') || groupNameLower.includes('shared')) defaultTarget = 'shared';

                    if (group.items) {
                        group.items.forEach(item => {
                            let target = defaultTarget;
                            const itemNameLower = item.name.toLowerCase();

                            // Check for Format: <chargable-pm-project> or <charge-pm-project>
                            // Split by hyphen to check segments if needed or just startswith
                            if (itemNameLower.startsWith('charge') || itemNameLower.startsWith('chargeable') || itemNameLower.startsWith('chg')) {
                                target = 'charge';
                            } else if (itemNameLower.startsWith('non-charge') || itemNameLower.startsWith('noncharge') || itemNameLower.includes('non-chargeable') || itemNameLower.startsWith('non')) {
                                target = 'nonCharge';
                            } else if (itemNameLower.includes('shared')) {
                                target = 'shared';
                            }
                            // Default remains 'nonCharge' if group name was generic 'All Projects' (AWS) and no prefix match

                            // Generate unique IDs if not present
                            const id = item.id || `item-${target}-${item.name.replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
                            if (!newItems[target]) newItems[target] = []; // Safety
                            newItems[target].push({ ...item, id });
                        });
                    }
                });
            }

            setItems(newItems);
            setViewMode('manage-items');
        } catch (err) {
            console.error(err);
            setError('Failed to load cost data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ---------------- DnD Handlers ----------------
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find containers
        const findContainer = (id) => {
            if (id in items) return id;
            if (id === 'trash') return 'trash'; // Support destroy zone
            return Object.keys(items).find((key) => items[key].find((i) => i.id === id));
        };

        const activeContainer = findContainer(activeId);
        const overContainer = findContainer(overId);

        if (!activeContainer || !overContainer) return;

        // Handle Delete / Destroy
        if (overContainer === 'trash') {
            setItems((prev) => {
                const activeItems = prev[activeContainer];
                return {
                    ...prev,
                    [activeContainer]: activeItems.filter((item) => item.id !== activeId),
                };
            });
            return;
        }

        // Move within same container
        if (activeContainer === overContainer) {
            const activeIndex = items[activeContainer].findIndex((i) => i.id === activeId);
            const overIndex = items[overContainer].findIndex((i) => i.id === overId);

            if (activeIndex !== overIndex) {
                setItems((prev) => ({
                    ...prev,
                    [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex),
                }));
            }
        } else {
            // Move to different container
            setItems((prev) => {
                const activeItems = prev[activeContainer];
                const overItems = prev[overContainer];
                const activeIndex = activeItems.findIndex((i) => i.id === activeId);
                const overIndex = overItems.findIndex((i) => i.id === overId);

                let newIndex;
                if (overId in prev) {
                    newIndex = overItems.length + 1;
                } else {
                    const isBelowOverItem =
                        over &&
                        active.rect.current.translated &&
                        active.rect.current.translated.top > over.rect.top + over.rect.height;

                    const modifier = isBelowOverItem ? 1 : 0;

                    newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
                }

                return {
                    ...prev,
                    [activeContainer]: [
                        ...prev[activeContainer].filter((item) => item.id !== activeId),
                    ],
                    [overContainer]: [
                        ...prev[overContainer].slice(0, newIndex),
                        activeItems[activeIndex],
                        ...prev[overContainer].slice(newIndex, prev[overContainer].length),
                    ],
                };
            });
        }
    };

    // ---------------- Report & Calculation Logic ----------------

    const calculateReport = () => {
        const rate = parseFloat(exchangeRate) || 1;

        // 1. Calculate base totals (Convert USD to THB)
        const sharedTotal = items.shared.reduce((sum, item) => sum + item.cost, 0) * rate;
        const chargeBaseTotal = items.charge.reduce((sum, item) => sum + item.cost, 0) * rate;
        const nonChargeTotal = items.nonCharge.reduce((sum, item) => sum + item.cost, 0) * rate;

        // 2. Weights (proportional distribution)
        const finalChargeItems = items.charge.map(item => {
            const itemCostTHB = item.cost * rate;
            const weight = chargeBaseTotal > 0 ? (itemCostTHB / chargeBaseTotal) : 0;
            const shareAmount = sharedTotal * weight;
            return {
                ...item,
                baseCost: itemCostTHB,
                shareAmount: shareAmount,
                finalCost: itemCostTHB + shareAmount
            };
        });

        const finalNonChargeItems = items.nonCharge.map(item => ({
            ...item,
            cost: item.cost * rate
        }));

        const finalSharedItems = items.shared.map(item => ({
            ...item,
            cost: item.cost * rate
        }));


        return {
            sharedTotal,
            chargeBaseTotal,
            nonChargeTotal: nonChargeTotal,
            items: {
                charge: finalChargeItems,
                nonCharge: finalNonChargeItems, // Non-charge usually doesn't get shared cost?
                shared: finalSharedItems
            },
            grandTotal: sharedTotal + chargeBaseTotal + nonChargeTotal
        };
    };

    const handleGenerateReport = () => {
        setViewMode('final-report');
    };

    const handleReset = () => {
        handleGetCost(); // Refetch
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Breadcrumb */}
            <div>
                <nav className="flex" aria-label="Breadcrumb">
                    <ol className="inline-flex items-center space-x-1 md:space-x-3">
                        <li className="inline-flex items-center">
                            <Link href="/operations" className="text-gray-700 hover:text-blue-600">
                                Operations
                            </Link>
                        </li>
                        <li><span className="mx-2 text-gray-400">/</span><span className="text-gray-500">AWS Non-Prod</span></li>
                        <li aria-current="page"><span className="mx-2 text-gray-400">/</span><span className="text-gray-900 font-medium">Billing & Cost Explorer</span></li>
                    </ol>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900 mt-2">Cost explore for AWS-nonprod account</h1>
            </div>

            {/* ERROR Display */}
            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
                    {error}
                </div>
            )}

            {/* LOADING Display */}
            {loading && (
                <div className="fixed inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* VIEW 1: SELECT PERIOD */}
            {viewMode === 'select-period' && (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto w-full mt-10">
                    <h2 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-2">Select Period to Explore</h2>

                    <div className="flex gap-4 mb-8">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-3 px-4 text-lg border"
                            >
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 py-3 px-4 text-lg border"
                            >
                                {months.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleGetCost}
                        className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Get Cost'}
                        {!loading && (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                        )}
                    </button>

                    <div className="mt-6 text-sm text-gray-500 text-center">
                        Fetches billing data from AWS Cost Explorer API
                    </div>
                </div>
            )}

            {/* VIEW 2: MANAGE ITEMS (Drag & Drop) */}
            {viewMode === 'manage-items' && (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex flex-col h-full">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <button onClick={() => setViewMode('select-period')} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></button>
                                Modify Cost for {months.find(m => m.id === selectedMonth)?.name} {selectedYear}
                            </h2>
                            {/* Exchange Rate Input */}
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded border">
                                <span className="text-sm font-medium text-gray-600">1 USD :</span>
                                <input
                                    type="number"
                                    value={exchangeRate}
                                    onChange={(e) => setExchangeRate(e.target.value)}
                                    // Removed onBlur refetch
                                    className="w-16 border rounded text-right px-1"
                                />
                                <span className="text-sm font-medium text-gray-600">THB</span>
                                {/* Removed Update button as calculation is now client-side only */}
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleReset} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Reset</button>
                                <button onClick={handleGenerateReport} className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 shadow-sm">Save & Generate Report</button>
                            </div>
                        </div>

                        {/* Manual Add Section */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name (e.g., charge-new-project)</label>
                                <input
                                    type="text"
                                    value={newItemName}
                                    onChange={(e) => setNewItemName(e.target.value)}
                                    placeholder="Enter project/item name"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div className="w-full md:w-48">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (USD)</label>
                                <input
                                    type="number"
                                    value={newItemCost}
                                    onChange={(e) => setNewItemCost(e.target.value)}
                                    placeholder="0.00"
                                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border p-2"
                                />
                            </div>
                            <button
                                onClick={handleAddManualItem}
                                className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-sm"
                            >
                                Add Project:Cost
                            </button>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
                            {/* Column 1: CHANGE / CHARGE */}
                            <DroppableContainer
                                id="charge"
                                items={items.charge}
                                title="Charge (Server)"
                                className="flex-1 flex flex-col bg-gray-50 rounded-lg border border-gray-200 p-4"
                                total={items.charge.reduce((s, i) => s + i.cost, 0)}
                                exchangeRate={parseFloat(exchangeRate) || 1}
                                onEdit={(itemId) => handleEditItem(itemId, 'charge')}
                            />

                            {/* Column 2: NON-CHARGE */}
                            <DroppableContainer
                                id="nonCharge"
                                items={items.nonCharge}
                                title="Non-Charge"
                                className="flex-1 flex flex-col bg-gray-50 rounded-lg border border-gray-200 p-4"
                                total={items.nonCharge.reduce((s, i) => s + i.cost, 0)}
                                exchangeRate={parseFloat(exchangeRate) || 1}
                                onEdit={(itemId) => handleEditItem(itemId, 'nonCharge')}
                            />
                        </div>

                        {/* Bottom Area: SHARED COST */}
                        <DroppableContainer
                            id="shared"
                            items={items.shared}
                            title="Shared Cost (Distributed to Charge Items)"
                            className="mt-6 bg-orange-50 rounded-lg border border-orange-200 p-4 min-h-[150px]"
                            total={items.shared.reduce((s, i) => s + i.cost, 0)}
                            isShared={true}
                            exchangeRate={parseFloat(exchangeRate) || 1}
                            onEdit={(itemId) => handleEditItem(itemId, 'shared')}
                        />

                        {/* Trash Zone */}
                        {/* Edit Modal */}
                        {editingItem && (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                                    <h3 className="text-lg font-bold mb-4">Edit Item</h3>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            value={editingItem.name}
                                            onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                            className="w-full border p-2 rounded"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost (USD)</label>
                                        <input
                                            type="number"
                                            value={editingItem.cost}
                                            onChange={(e) => setEditingItem({ ...editingItem, cost: e.target.value })}
                                            className="w-full border p-2 rounded"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setEditingItem(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                        <button onClick={saveEditItem} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <TrashContainer />
                    </div>

                    {/* Drag Overlay for smooth visual */}
                    <DragOverlay>
                        {activeId ? (
                            <div className="bg-white p-3 rounded shadow-lg border border-blue-500 opacity-90 w-64">
                                Dragging Item...
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            )}

            {/* VIEW 3: FINAL REPORT */}
            {viewMode === 'final-report' && (
                <FinalReportView
                    year={selectedYear}
                    month={months.find(m => m.id === selectedMonth)?.name}
                    data={calculateReport()}
                    onBack={() => setViewMode('manage-items')}
                />
            )}
        </div>
    );
}

function FinalReportView({ year, month, data, onBack }) {

    // Export Handlers
    const handleExportCSV = () => {
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += `AWS Cost Report - ${month} ${year}\n\n`;

        // Section 1: Charge Projects
        csvContent += "CHARGE (SERVER),Base Cost,Shared Allocation,Final Cost\n";
        data.items.charge.forEach(item => {
            csvContent += `"${item.name}",${item.baseCost},${item.shareAmount},${item.finalCost}\n`;
        });
        csvContent += `TOTAL CHARGE,${data.chargeBaseTotal},${data.sharedTotal},${data.chargeBaseTotal + data.sharedTotal}\n\n`;

        // Section 2: Non-Charge
        csvContent += "NON-CHARGE,Cost,,\n";
        data.items.nonCharge.forEach(item => {
            csvContent += `"${item.name}",${item.cost},,\n`;
        });
        csvContent += `TOTAL NON-CHARGE,${data.nonChargeTotal},,\n\n`;

        // Section 3: Shared Source (Reference)
        csvContent += "SHARED SOURCE (Distributed above),Cost,,\n";
        data.items.shared.forEach(item => {
            csvContent += `"${item.name}",${item.cost},,\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `aws_cost_final_${year}_${month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportJSON = () => {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `aws_cost_report_${year}_${month}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Print handler embedded in button onClick directly or wrap here
    const handlePrint = () => {
        // Create a printable area or just print window
        // For better PDF export, using window.print() and Save as PDF is simplest standard
        window.print();
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors" title="Back to Modify">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <h2 className="text-xl font-bold">
                        Final Report: {month} {year}
                    </h2>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleExportJSON} className="px-3 py-2 border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded text-sm font-medium">Export JSON</button>
                    <button onClick={handleExportCSV} className="px-3 py-2 border border-green-200 text-green-700 bg-green-50 hover:bg-green-100 rounded text-sm font-medium">Export CSV</button>
                    <button onClick={handlePrint} className="px-3 py-2 border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 rounded text-sm font-medium">Print / PDF</button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left font-bold text-gray-700 uppercase tracking-wider">Project / Item</th>
                            <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase tracking-wider">Base Cost</th>
                            <th className="px-6 py-3 text-right font-bold text-gray-700 uppercase tracking-wider text-orange-600">+ Shared Alloc.</th>
                            <th className="px-6 py-3 text-right font-bold text-gray-900 uppercase tracking-wider">Final Cost (THB)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* 1. CHARGE SECTION */}
                        <tr className="bg-blue-50">
                            <td colSpan={4} className="px-6 py-2 font-bold text-blue-800">CHARGE (SERVER)</td>
                        </tr>
                        {data.items.charge.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-2 text-gray-900">{item.name}</td>
                                <td className="px-6 py-2 text-right text-gray-500">{item.baseCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-2 text-right text-orange-600 font-mono text-xs">+{item.shareAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-2 text-right font-bold text-gray-900">{item.finalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold border-t-2 border-gray-300">
                            <td className="px-6 py-2">Subtotal Charge</td>
                            <td className="px-6 py-2 text-right">{data.chargeBaseTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-6 py-2 text-right text-orange-600">+{data.sharedTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-6 py-2 text-right">{(data.chargeBaseTotal + data.sharedTotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>

                        {/* 2. NON-CHARGE SECTION */}
                        <tr className="bg-gray-100">
                            <td colSpan={4} className="px-6 py-2 font-bold text-gray-800 mt-4">NON-CHARGE</td>
                        </tr>
                        {data.items.nonCharge.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-2 text-gray-900">{item.name}</td>
                                <td className="px-6 py-2 text-right text-gray-500">{item.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-2 text-right text-gray-400">-</td>
                                <td className="px-6 py-2 text-right text-gray-500">{item.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold border-t border-gray-300">
                            <td className="px-6 py-2">Subtotal Non-Charge</td>
                            <td className="px-6 py-2 text-right">{data.nonChargeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td className="px-6 py-2 text-right">-</td>
                            <td className="px-6 py-2 text-right">{data.nonChargeTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        </tr>

                        {/* GRAND TOTAL */}
                        <tr className="bg-green-100 border-t-4 border-green-500 text-lg">
                            <td className="px-6 py-4 font-bold text-green-900">GRAND TOTAL</td>
                            <td className="px-6 py-4 text-right"></td>
                            <td className="px-6 py-4 text-right"></td>
                            <td className="px-6 py-4 text-right font-bold text-green-900">{data.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} THB</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded text-xs text-gray-500">
                <h4 className="font-bold mb-2">Calculation Notes:</h4>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Shared costs ({data.sharedTotal.toLocaleString()} THB) are distributed to "Charge" items proportionally based on their base cost.</li>
                    <li>Distribution Formula: Item Share = Total Shared * (Item Base Cost / Sum of All Charge Base Costs)</li>
                    <li>Non-charge items are excluded from shared cost allocation.</li>
                </ul>
            </div>

            <div className="h-20"></div> {/* Spacer for print/scroll */}
        </div>
    );
}


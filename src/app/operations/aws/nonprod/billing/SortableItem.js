import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableItem({ id, name, cost, type }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    // Determine border color based on type for visual cue
    // charge = blue, nonCharge = gray, shared = orange
    let borderColor = 'border-gray-200';
    if (type === 'charge') borderColor = 'border-indigo-200 hover:border-indigo-300';
    if (type === 'shared') borderColor = 'border-orange-200 hover:border-orange-300';

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`bg-white p-3 mb-2 rounded shadow-sm border ${borderColor} cursor-move flex justify-between items-center group`}
        >
            <div className="flex items-center gap-2 overflow-hidden">
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span className="text-sm font-medium text-gray-700 truncate" title={name}>{name}</span>
            </div>
            <span className="text-sm font-mono text-gray-500 flex-shrink-0 ml-2">
                {cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
        </div>
    );
}

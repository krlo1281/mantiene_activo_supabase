import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface Option {
    value: string;
    label: string;
}

interface MultiSelectProps {
    options: Option[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Seleccionar...",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const toggleOption = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];
        onChange(newSelected);
    };

    const handleSelectAll = () => {
        if (selected.length === filteredOptions.length) {
            onChange([]);
        } else {
            onChange(filteredOptions.map((opt) => opt.value));
        }
    };

    const filteredOptions = options.filter((opt) =>
        opt.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between h-auto py-2 min-h-[40px]"
                onClick={() => setOpen(!open)}
            >
                <div className="flex flex-wrap gap-1 items-center bg-transparent">
                    {selected.length === 0 && <span className="text-muted-foreground font-normal">{placeholder}</span>}
                    {selected.length > 0 && selected.length <= 2 ? (
                        selected.map((val) => (
                            <Badge key={val} variant="secondary" className="mr-1 mb-0.5">
                                {options.find((opt) => opt.value === val)?.label || val}
                            </Badge>
                        ))
                    ) : selected.length > 2 ? (
                        <span className="font-normal">{selected.length} seleccionados</span>
                    ) : null}
                </div>
                <span className="material-symbols-outlined text-gray-400 text-[18px]">
                    unfold_more
                </span>
            </Button>

            {open && (
                <div className="absolute z-[999] mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in fade-in-0 zoom-in-95">
                    <div className="p-2 border-b">
                        <input
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Buscar..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            // Prevent auto-closing when clicking input
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                No se encontraron resultados.
                            </div>
                        ) : (
                            <>
                                <div
                                    className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
                                    onClick={handleSelectAll}
                                >
                                    <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${selected.length === filteredOptions.length && filteredOptions.length > 0 ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"}`}>
                                        <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                    </div>
                                    <span className="font-medium">Seleccionar Todo</span>
                                </div>
                                {filteredOptions.map((option) => {
                                    const isSelected = selected.includes(option.value);
                                    return (
                                        <div
                                            key={option.value}
                                            className="relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer"
                                            onClick={() => toggleOption(option.value)}
                                        >
                                            <div className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${isSelected ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"}`}>
                                                <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                            </div>
                                            <span>{option.label}</span>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

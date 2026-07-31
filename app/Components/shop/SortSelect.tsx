"use client";

export type SortOption =
  | "recommended"
  | "price-low"
  | "price-high"
  | "data-high"
  | "validity-high";

type SortSelectProps = {
  value: SortOption;
  onChange: (value: SortOption) => void;
};

export default function SortSelect({
  value,
  onChange,
}: SortSelectProps) {
  return (
    <div className="w-full lg:w-56">
      <label
        htmlFor="sort-plans"
        className="mb-2 block text-sm font-semibold text-slate-700"
      >
        Sort plans
      </label>

      <select
        id="sort-plans"
        value={value}
        onChange={(event) =>
          onChange(event.target.value as SortOption)
        }
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
      >
        <option value="recommended">Recommended</option>
        <option value="price-low">Lowest price</option>
        <option value="price-high">Highest price</option>
        <option value="data-high">Most data</option>
        <option value="validity-high">Longest validity</option>
      </select>
    </div>
  );
}
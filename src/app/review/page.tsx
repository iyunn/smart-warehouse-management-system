"use client";

import {
  memo,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import ReviewSummaryCards from "@/components/review/ReviewSummaryCards";
import ReviewTableToolbar from "@/components/review/ReviewTableToolbar";
import ReviewTableRow from "@/components/review/ReviewTableRow";
import { AddRuleModal } from "@/components/review/AddRuleModal";
import { useReviewAssets } from "@/hooks/useReviewAssets";
import type { FilterType } from "@/lib/reviewTypes";

const PAGE_SIZE = 15;

// ─── Empty State ─────────────────────────────────────────────────────────────

const EmptyState = memo(() => (
  <div className="flex flex-col items-center justify-center py-24 text-center">
    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-cyan-400/60"
      >
        <circle cx="14" cy="14" r="11" />
        <path d="M14 9v5.5M14 18.5v.5" />
      </svg>
    </div>
    <p className="text-sm font-medium text-white/60">Tidak ada aset unknown</p>
    <p className="mt-1 max-w-xs text-xs text-white/30">
      Semua aset sudah terklasifikasi. Tambah rule baru jika muncul aset baru
      yang tidak dikenali.
    </p>
  </div>
));
EmptyState.displayName = "EmptyState";

// ─── Loading State ────────────────────────────────────────────────────────────

const LoadingRows = memo(() => (
  <div className="divide-y divide-white/5">
    {Array.from({ length: 6 }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-3.5">
        <div
          className="h-3 rounded bg-white/5"
          style={{ width: `${30 + (i % 3) * 15}%`, opacity: 1 - i * 0.12 }}
        />
        <div className="ml-auto h-3 w-16 rounded bg-white/5" />
        <div className="h-3 w-20 rounded bg-white/5" />
        <div className="h-6 w-14 rounded-full bg-white/5" />
      </div>
    ))}
  </div>
));
LoadingRows.displayName = "LoadingRows";

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  totalItems: number;
  pageSize: number;
}

const Pagination = memo(
  ({ page, totalPages, onPage, totalItems, pageSize }: PaginationProps) => {
    if (totalPages <= 1) return null;

    const from = (page - 1) * pageSize + 1;
    const to = Math.min(page * pageSize, totalItems);

    return (
      <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
        <p className="text-xs text-white/30">
          Menampilkan{" "}
          <span className="text-white/60">
            {from}–{to}
          </span>{" "}
          dari <span className="text-white/60">{totalItems}</span> aset
        </p>
        <div className="flex items-center gap-1">
          <PageBtn
            onClick={() => onPage(page - 1)}
            disabled={page === 1}
            aria-label="Halaman sebelumnya"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 2L3 6l4 4" />
            </svg>
          </PageBtn>

          {buildPageNums(page, totalPages).map((p, idx) =>
            p === "…" ? (
              <span key={`ellipsis-${idx}`} className="px-1 text-xs text-white/20">
                …
              </span>
            ) : (
              <PageBtn
                key={p}
                onClick={() => onPage(p as number)}
                active={p === page}
              >
                {p}
              </PageBtn>
            )
          )}

          <PageBtn
            onClick={() => onPage(page + 1)}
            disabled={page === totalPages}
            aria-label="Halaman berikutnya"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 2l4 4-4 4" />
            </svg>
          </PageBtn>
        </div>
      </div>
    );
  }
);
Pagination.displayName = "Pagination";

function buildPageNums(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  if (current > 3) pages.push("…");
  for (
    let i = Math.max(2, current - 1);
    i <= Math.min(total - 1, current + 1);
    i++
  )
    pages.push(i);
  if (current < total - 2) pages.push("…");
  pages.push(total);
  return pages;
}

interface PageBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: React.ReactNode;
}

const PageBtn = memo(({ active, children, ...props }: PageBtnProps) => (
  <button
    {...props}
    className={[
      "flex h-7 min-w-7 items-center justify-center rounded-lg px-1.5 text-xs font-medium transition-colors",
      active
        ? "border border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
        : "text-white/40 hover:bg-white/5 hover:text-white disabled:pointer-events-none disabled:opacity-25",
    ].join(" ")}
  >
    {children}
  </button>
));
PageBtn.displayName = "PageBtn";

// ─── Table Header ─────────────────────────────────────────────────────────────

const TableHeader = memo(() => (
  <div className="grid grid-cols-[1fr_140px_120px_100px_80px_44px] gap-4 border-b border-white/5 px-5 py-2.5">
    {["Nama Aset", "Lokasi", "Kategori", "Confidence", "Status", ""].map(
      (h) => (
        <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
          {h}
        </span>
      )
    )}
  </div>
));
TableHeader.displayName = "TableHeader";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReviewPage() {
  const { assets, loading, summary, removeById } = useReviewAssets();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<{
    id: string;
    keyword: string;
  } | null>(null);

  const deferredSearch = useDeferredValue(search);

  // ── Filter + Search ──────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = assets;
    if (filter !== "all") {
      list = list.filter((a) => a.jenis === filter);
    }
    const q = deferredSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (a) =>
          a.original_description?.toLowerCase().includes(q) ||
          a.kategori?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [assets, filter, deferredSearch]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Reset to page 1 on filter/search change
  const handleSearch = useCallback((v: string) => {
    setSearch(v);
    setPage(1);
  }, []);
  const handleFilter = useCallback((v: FilterType) => {
    setFilter(v);
    setPage(1);
  }, []);

  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // ── Modal handlers ────────────────────────────────────────────────────────
  const openModal = useCallback((assetId?: string, keyword?: string) => {
    setSelectedAsset(
      assetId ? { id: assetId, keyword: keyword ?? "" } : null
    );
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedAsset(null);
  }, []);

  const handleRuleSuccess = useCallback(
    (assetId?: string) => {
      if (assetId) removeById(assetId);
    },
    [removeById]
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#080e18] text-white">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title="Review Assets" />

        <main className="flex-1 overflow-y-auto px-6 py-5">
          {/* ── Page header ──────────────────────────────────────── */}
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Review Aset
              </h1>
              <p className="mt-0.5 text-xs text-white/40">
                Klasifikasi aset yang belum dikenali oleh sistem secara otomatis
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Live count badge */}
              <div className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-40" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
                </span>
                <span className="text-xs font-medium text-white/70">
                  {loading ? "—" : assets.length} aset unknown
                </span>
              </div>

              <button
                onClick={() => openModal()}
                className="flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-sm transition-all hover:bg-cyan-500/20 hover:text-cyan-200"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 1v10M1 6h10" />
                </svg>
                Add Rule
              </button>
            </div>
          </div>

          {/* ── Summary cards ─────────────────────────────────────── */}
          <div className="mb-5">
            <ReviewSummaryCards summary={summary} loading={loading} />
          </div>

          {/* ── Table card ────────────────────────────────────────── */}
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] shadow-xl shadow-black/30">
            {/* Toolbar */}
            <ReviewTableToolbar
            search={search}
            onSearch={handleSearch}
            filter={filter as any}
            onFilter={handleFilter as any}
            totalFiltered={filtered.length}
            totalAll={assets.length}
          />

            {/* Table */}
            {loading ? (
              <LoadingRows />
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <TableHeader />
                <div className="divide-y divide-white/[0.04]">
                  {paginated.map((asset) => (
                    <ReviewTableRow
                      key={asset.id}
                      asset={asset}
                      onAddRule={(asset) =>
                        openModal(asset.id, asset.original_description)
                      }
                    />
                  ))}
                </div>
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPage={setPage}
                  totalItems={filtered.length}
                  pageSize={PAGE_SIZE}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Modal ──────────────────────────────────────────────── */}
      {modalOpen && (
        <AddRuleModal
          assetId={selectedAsset?.id}
          defaultKeyword={selectedAsset?.keyword}
          onClose={closeModal}
          onSuccess={handleRuleSuccess}
        />
      )}
    </div>
  );
}

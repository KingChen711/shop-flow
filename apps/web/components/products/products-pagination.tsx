/* eslint-disable @typescript-eslint/ban-ts-comment */
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';

interface ProductsPaginationProps {
  currentPage: number;
  totalPages: number;
}

export function ProductsPagination({ currentPage, totalPages }: ProductsPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', String(page));
      return params.toString();
    },
    [searchParams]
  );

  const goToPage = (page: number) => {
    router.push(`${pathname}?${createQueryString(page)}`);
  };

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="mt-8 flex justify-center gap-2">
      <button
        className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={currentPage <= 1}
        onClick={() => goToPage(currentPage - 1)}
      >
        Previous
      </button>

      {visiblePages[0] && visiblePages[0] > 1 && (
        <>
          <button
            className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
            onClick={() => goToPage(1)}
          >
            1
          </button>
          {visiblePages[0] && visiblePages[0] > 2 && (
            <span className="px-2 py-2 text-muted-foreground">...</span>
          )}
        </>
      )}

      {visiblePages.map((page) => (
        <button
          key={page}
          className={`rounded-md px-4 py-2 text-sm ${
            currentPage === page ? 'bg-primary text-primary-foreground' : 'border hover:bg-accent'
          }`}
          onClick={() => goToPage(page)}
        >
          {page}
        </button>
      ))}

      {visiblePages[visiblePages.length - 1] &&
        // @ts-ignore
        visiblePages[visiblePages.length - 1] < totalPages && (
          <>
            {visiblePages[visiblePages.length - 1] &&
              // @ts-ignore
              visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="px-2 py-2 text-muted-foreground">...</span>
              )}
            <button
              className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
              onClick={() => goToPage(totalPages)}
            >
              {totalPages}
            </button>
          </>
        )}

      <button
        className="rounded-md border px-4 py-2 text-sm hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={currentPage >= totalPages}
        onClick={() => goToPage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}

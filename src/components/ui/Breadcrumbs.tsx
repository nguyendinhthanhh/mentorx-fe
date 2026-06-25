import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

export interface BreadcrumbItem {
  label: string
  to?: string
  icon?: React.ReactNode
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null

  return (
    <nav className={`flex flex-wrap items-center gap-1 sm:gap-2 text-sm font-medium ${className}`} aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1

        return (
          <div key={index} className="flex items-center gap-1 sm:gap-2">
            {isLast ? (
              <span className="flex items-center gap-1.5 text-gray-900 font-bold max-w-[200px] sm:max-w-xs truncate" aria-current="page">
                {item.icon}
                <span className="truncate">{item.label}</span>
              </span>
            ) : (
              <Link
                to={item.to || '#'}
                className="flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition-colors"
              >
                {item.icon && index === 0 ? (
                  item.icon
                ) : index === 0 && !item.icon ? (
                  <Home className="h-4 w-4" />
                ) : (
                  item.icon
                )}
                <span className="hidden sm:inline">{item.label}</span>
                <span className="inline sm:hidden">{index === 0 ? '' : item.label}</span>
              </Link>
            )}

            {!isLast && (
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            )}
          </div>
        )
      })}
    </nav>
  )
}

"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { PackageIcon } from "@/components/simple-icons"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    href?: string
    onClick?: () => void
  }
  secondaryAction?: {
    label: string
    href?: string
    onClick?: () => void
  }
}

export function EmptyState({ icon, title, description, action, secondaryAction }: EmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          {icon || <PackageIcon className="w-10 h-10 text-primary" />}
        </div>

        {/* Title */}
        <h3 className="text-2xl font-semibold text-foreground mb-4">{title}</h3>

        {/* Description */}
        <p className="text-muted-foreground mb-6 text-balance">{description}</p>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {action &&
              (action.href ? (
                <Link href={action.href}>
                  <Button className="origami-button">{action.label}</Button>
                </Link>
              ) : (
                <Button className="origami-button" onClick={action.onClick}>
                  {action.label}
                </Button>
              ))}

            {secondaryAction &&
              (secondaryAction.href ? (
                <Link href={secondaryAction.href}>
                  <Button variant="secondary" className="origami-card">
                    {secondaryAction.label}
                  </Button>
                </Link>
              ) : (
                <Button variant="secondary" className="origami-card" onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

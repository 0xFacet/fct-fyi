import React from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  description?: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({ 
  title, 
  icon,
  description,
  children, 
  defaultOpen = true 
}: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <Collapsible.Trigger asChild>
          <button className="w-full p-6 bg-gradient-to-r from-purple-900/5 to-blue-900/5 dark:from-purple-900/10 dark:to-blue-900/10 border-b border-gray-200 dark:border-gray-700 hover:from-purple-900/10 hover:to-blue-900/10 dark:hover:from-purple-900/20 dark:hover:to-blue-900/20 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="text-purple-500 dark:text-purple-400">
                    {icon}
                  </div>
                )}
                <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                  {title}
                </h2>
              </div>
              <ChevronDown 
                className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                  open ? 'rotate-180' : ''
                }`}
              />
            </div>
            {description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-left mt-3 leading-relaxed">
                {description}
              </p>
            )}
          </button>
        </Collapsible.Trigger>
        
        <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
          <div className="p-6">
            {children}
          </div>
        </Collapsible.Content>
      </div>
    </Collapsible.Root>
  )
}
import React from 'react'
import * as Collapsible from '@radix-ui/react-collapsible'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CollapsibleSection({ 
  title, 
  icon,
  children, 
  defaultOpen = true 
}: CollapsibleSectionProps) {
  const [open, setOpen] = React.useState(defaultOpen)

  return (
    <Collapsible.Root open={open} onOpenChange={setOpen}>
      <Collapsible.Trigger asChild>
        <button className="flex items-center justify-between w-full py-4 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors group">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="text-facet-blue">
                {icon}
              </div>
            )}
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
              {title}
            </h2>
          </div>
          <ChevronDown 
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      </Collapsible.Trigger>
      
      <Collapsible.Content className="overflow-hidden data-[state=closed]:animate-slideUp data-[state=open]:animate-slideDown">
        <div className="pb-4">
          {children}
        </div>
      </Collapsible.Content>
    </Collapsible.Root>
  )
}
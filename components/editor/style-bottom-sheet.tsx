'use client'

import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet'
import { SimplifiedStylePicker } from './simplified-style-picker'
import { type SimpleSelection } from '@/lib/simplified-styles'

interface StyleBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  selection: SimpleSelection
  onSelectionChange: (selection: SimpleSelection) => void
}

export function StyleBottomSheet({
  isOpen,
  onClose,
  selection,
  onSelectionChange,
}: StyleBottomSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-2xl p-0 flex flex-col"
        hideCloseButton
      >
        {/* Handle bar for dragging */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Style Picker Content - Scrollable */}
        <div className="flex-1 overflow-hidden">
          <SimplifiedStylePicker
            selection={selection}
            onSelectionChange={onSelectionChange}
            onClose={onClose}
          />
        </div>

        {/* Safe area for iOS */}
        <div className="h-safe flex-shrink-0" />
      </SheetContent>
    </Sheet>
  )
}

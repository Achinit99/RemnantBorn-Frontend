'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:border-[#1f3b3f] group-[.toaster]:bg-[#071a1f]/95 group-[.toaster]:text-[#e6edf0] group-[.toaster]:shadow-[0_16px_40px_-18px_rgba(0,0,0,0.8)] group-[.toaster]:backdrop-blur-md',
          title: 'font-display text-[13px] font-semibold tracking-[0.01em]',
          description: 'font-sans text-[12px] text-[#9ab0b5]',
          success: 'group-[.toast]:border-[#1c4d35] group-[.toast]:bg-[#082117]/95',
          icon: 'text-[#7bf1a8]',
          actionButton:
            'group-[.toast]:bg-[#0f2f37] group-[.toast]:text-[#e6edf0] group-[.toast]:hover:bg-[#16414c]',
          cancelButton:
            'group-[.toast]:bg-transparent group-[.toast]:text-[#9ab0b5] group-[.toast]:hover:bg-[#0e252b] group-[.toast]:hover:text-[#e6edf0]',
        },
      }}
      style={
        {
          '--normal-bg': 'rgba(7, 26, 31, 0.95)',
          '--normal-text': '#e6edf0',
          '--normal-border': '#1f3b3f',
          '--success-bg': 'rgba(8, 33, 23, 0.95)',
          '--success-border': '#1c4d35',
          '--success-text': '#e6edf0',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }

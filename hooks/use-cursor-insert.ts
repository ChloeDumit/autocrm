import { useCallback, RefObject } from 'react'

interface InsertResult {
  newValue: string
  newCursorPosition: number
}

export function useCursorInsert(textareaRef: RefObject<HTMLTextAreaElement | null>) {
  const insertAtCursor = useCallback((textToInsert: string): InsertResult | null => {
    const textarea = textareaRef.current
    if (!textarea) return null

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentValue = textarea.value

    const newValue =
      currentValue.substring(0, start) +
      textToInsert +
      currentValue.substring(end)

    return {
      newValue,
      newCursorPosition: start + textToInsert.length
    }
  }, [textareaRef])

  const setCursorPosition = useCallback((position: number) => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.focus()
    // Use setTimeout to ensure the cursor is set after React re-renders
    setTimeout(() => {
      textarea.setSelectionRange(position, position)
    }, 0)
  }, [textareaRef])

  const focusTextarea = useCallback(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.focus()
    }
  }, [textareaRef])

  return { insertAtCursor, setCursorPosition, focusTextarea }
}

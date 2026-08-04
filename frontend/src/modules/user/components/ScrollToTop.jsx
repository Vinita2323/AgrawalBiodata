import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
    document.documentElement.scrollTo(0, 0)
    document.body.scrollTo(0, 0)

    // Scroll any scrollable container to top if present
    const containers = document.querySelectorAll('.overflow-y-auto, .overflow-auto')
    containers.forEach((el) => {
      el.scrollTop = 0
    })
  }, [pathname])

  return null
}

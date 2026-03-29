import { useNavigate } from 'react-router-dom'

export default function Navbar({ title, backTo, actions }) {
  const navigate = useNavigate()

  return (
    <nav className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="p-2 -ml-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              aria-label="Volver"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h1 className="text-base font-semibold text-gray-900 truncate">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </nav>
  )
}

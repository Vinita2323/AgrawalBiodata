import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { UserFlowPage } from './modules/user'

export default function App() {
  return (
    <Router>
      <UserFlowPage />
    </Router>
  )
}
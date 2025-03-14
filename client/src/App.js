import React from 'react';
import { Container } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PriceComparison from './components/PriceComparison';
import AddProduct from './components/AddProduct';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const handleProductAdded = () => {
    // Refresh the price comparison table
    window.location.reload();
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Container maxWidth="lg" sx={{ py: 4 }}>
                <AddProduct onProductAdded={handleProductAdded} />
                <PriceComparison />
              </Container>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
